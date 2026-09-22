from rest_framework import serializers
from django.utils import timezone
from .models import CustomUser, Equipment, Reservation


# ─────────────────────────────────────────────
#  Auth Serializers
# ─────────────────────────────────────────────

class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=8)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'password', 'role', 'first_name', 'last_name']

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            role=validated_data.get('role', 'user'),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role', 'first_name', 'last_name']


# ─────────────────────────────────────────────
#  Equipment Serializer
# ─────────────────────────────────────────────

class EquipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = ['id', 'name', 'category', 'description', 'status', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


# ─────────────────────────────────────────────
#  Reservation Serializer  (conflict-checking lives here)
# ─────────────────────────────────────────────

class ReservationSerializer(serializers.ModelSerializer):
    # Read-only convenience fields resolved via FK
    equipment_name = serializers.CharField(source='equipment.name', read_only=True)
    equipment_category = serializers.CharField(source='equipment.category', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Reservation
        fields = [
            'id',
            'equipment', 'equipment_name', 'equipment_category',
            'user', 'username',
            'start_time', 'end_time',
            'status', 'notes',
            'created_at',
        ]
        read_only_fields = ['user', 'status', 'created_at']

    # ── Conflict-checking validation ──────────────────────────────────────
    def validate(self, data):
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        equipment = data.get('equipment')

        # Basic time-range sanity
        if start_time and end_time:
            if start_time >= end_time:
                raise serializers.ValidationError(
                    {'end_time': 'End time must be after start time.'}
                )
            if start_time < timezone.now():
                raise serializers.ValidationError(
                    {'start_time': 'Start time cannot be in the past.'}
                )

        # ── Core overlap check ────────────────────────────────────────────
        # Two time ranges [A, B) and [C, D) overlap iff A < D and C < B
        # i.e.  new.start_time < existing.end_time
        #       AND existing.start_time < new.end_time
        if equipment and start_time and end_time:
            qs = Reservation.objects.filter(
                equipment=equipment,
                status__in=['pending', 'active'],
                start_time__lt=end_time,   # existing starts before new ends
                end_time__gt=start_time,   # existing ends after new starts
            )
            # Exclude this instance when updating
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)

            if qs.exists():
                conflict = qs.first()
                raise serializers.ValidationError(
                    f'This equipment is already reserved from '
                    f'{conflict.start_time:%Y-%m-%d %H:%M} to '
                    f'{conflict.end_time:%H:%M} UTC. '
                    f'Please choose a different time slot.'
                )

        return data

    def create(self, validated_data):
        # Attach the requesting user automatically
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
