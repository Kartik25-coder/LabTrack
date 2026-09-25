from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

router = DefaultRouter()
router.register(r'equipment', views.EquipmentViewSet, basename='equipment')
router.register(r'experiments', views.ExperimentViewSet, basename='experiment')

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────
    path('auth/signup/', views.SignupView.as_view(), name='signup'),
    path('auth/login/', TokenObtainPairView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/me/', views.MeView.as_view(), name='me'),

    # ── Equipment (via router) ─────────────────────────────
    path('', include(router.urls)),

    # ── Reservations ───────────────────────────────────────
    path('reservations/', views.ReservationListCreateView.as_view(), name='reservation-list-create'),
    path('reservations/<int:pk>/', views.ReservationDetailView.as_view(), name='reservation-detail'),
    path('reservations/<int:pk>/cancel/', views.CancelReservationView.as_view(), name='reservation-cancel'),
]
