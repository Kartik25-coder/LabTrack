from rest_framework import generics, viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.utils import timezone

from .models import CustomUser, Equipment, Reservation
from .serializers import (
    SignupSerializer,
    UserSerializer,
    EquipmentSerializer,
    ReservationSerializer,
)
from .permissions import IsAdmin, IsAdminOrReadOnly


# ─────────────────────────────────────────────
#  Auth Views
# ─────────────────────────────────────────────

class SignupView(generics.CreateAPIView):
    """
    POST /api/auth/signup/
    Public endpoint. Creates a new user and returns user data (no token).
    """
    serializer_class = SignupSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class MeView(APIView):
    """
    GET /api/auth/me/
    Returns current authenticated user's profile.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


# ─────────────────────────────────────────────
#  Equipment Views
# ─────────────────────────────────────────────

class EquipmentViewSet(viewsets.ModelViewSet):
    """
    GET    /api/equipment/          — list (all authenticated)
    POST   /api/equipment/          — create (admin only)
    GET    /api/equipment/{id}/     — retrieve (all authenticated)
    PUT    /api/equipment/{id}/     — update (admin only)
    DELETE /api/equipment/{id}/     — delete (admin only)
    PATCH  /api/equipment/{id}/update_status/ — status-only update (admin only)
    """
    queryset = Equipment.objects.all()
    serializer_class = EquipmentSerializer
    permission_classes = [IsAdminOrReadOnly]

    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin], url_path='update_status')
    def update_status(self, request, pk=None):
        """Dedicated endpoint for admin to quickly change equipment status."""
        equipment = self.get_object()
        new_status = request.data.get('status')
        valid_statuses = ['available', 'in_use', 'maintenance']
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Must be one of: {valid_statuses}'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        equipment.status = new_status
        equipment.save(update_fields=['status', 'updated_at'])
        return Response(EquipmentSerializer(equipment).data)


# ─────────────────────────────────────────────
#  Reservation Views
# ─────────────────────────────────────────────

def _sync_reservation_statuses(queryset):
    """
    Auto-advance reservation statuses based on current time.
    - pending → active  (if start_time <= now <= end_time)
    - pending/active → completed  (if end_time < now)
    Called on every list fetch so the UI always reflects real state.
    """
    now = timezone.now()

    # Activate pending reservations whose window has started
    to_activate = queryset.filter(
        status='pending',
        start_time__lte=now,
        end_time__gte=now,
    ).values_list('id', flat=True)
    if to_activate:
        Reservation.objects.filter(id__in=list(to_activate)).update(status='active')

    # Complete reservations whose window has passed
    to_complete = queryset.filter(
        status__in=['pending', 'active'],
        end_time__lt=now,
    ).values_list('id', flat=True)
    if to_complete:
        Reservation.objects.filter(id__in=list(to_complete)).update(status='completed')


class ReservationListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/reservations/  — Admin sees all; User sees their own
    POST /api/reservations/  — Create with conflict-checking (serializer)
    """
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            qs = Reservation.objects.all().select_related('equipment', 'user')
        else:
            qs = Reservation.objects.filter(user=user).select_related('equipment', 'user')

        _sync_reservation_statuses(qs)

        # Re-query after status sync
        if user.role == 'admin':
            return Reservation.objects.all().select_related('equipment', 'user').order_by('-created_at')
        return Reservation.objects.filter(user=user).select_related('equipment', 'user').order_by('-created_at')

    def perform_create(self, serializer):
        reservation = serializer.save()

        # If the reservation starts now (or is overdue), mark it active
        # and update equipment status
        now = timezone.now()
        if reservation.start_time <= now <= reservation.end_time:
            reservation.status = 'active'
            reservation.save(update_fields=['status'])
            reservation.equipment.status = 'in_use'
            reservation.equipment.save(update_fields=['status', 'updated_at'])


class ReservationDetailView(generics.RetrieveAPIView):
    """
    GET /api/reservations/{id}/
    Admin can see any; user can only see their own.
    """
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Reservation.objects.all().select_related('equipment', 'user')
        return Reservation.objects.filter(user=user).select_related('equipment', 'user')


class CancelReservationView(APIView):
    """
    PATCH /api/reservations/{id}/cancel/
    Cancels a reservation. Admin can cancel any; user can only cancel their own.
    Also reverts equipment status to 'available' if no other active reservation exists.
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            if request.user.role == 'admin':
                reservation = Reservation.objects.select_related('equipment').get(pk=pk)
            else:
                reservation = Reservation.objects.select_related('equipment').get(
                    pk=pk, user=request.user
                )
        except Reservation.DoesNotExist:
            return Response(
                {'error': 'Reservation not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if reservation.status in ['cancelled', 'completed']:
            return Response(
                {'error': f'Cannot cancel a reservation that is already {reservation.status}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reservation.status = 'cancelled'
        reservation.save(update_fields=['status', 'updated_at'])

        # Revert equipment to 'available' if no other active/pending reservation
        # overlaps the current time window
        now = timezone.now()
        still_booked = Reservation.objects.filter(
            equipment=reservation.equipment,
            status__in=['pending', 'active'],
            start_time__lte=now,
            end_time__gte=now,
        ).exists()
        if not still_booked and reservation.equipment.status == 'in_use':
            reservation.equipment.status = 'available'
            reservation.equipment.save(update_fields=['status', 'updated_at'])

        return Response(ReservationSerializer(reservation).data)
