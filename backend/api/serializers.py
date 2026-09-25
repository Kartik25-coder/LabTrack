from rest_framework import serializers
from django.utils import timezone
from .models import CustomUser, Equipment, Reservation, Experiment


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
#  Experiment Serializer
# ─────────────────────────────────────────────

class ExperimentSerializer(serializers.ModelSerializer):
    equipment_used = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Equipment.objects.all(),
        required=False,
    )
    attachment_url = serializers.SerializerMethodField(read_only=True)
    attachment_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Experiment
        fields = [
            'id', 'title', 'category', 'description', 'lead_researcher',
            'status', 'start_date', 'end_date', 'outcome', 'equipment_used',
            'attachment', 'attachment_url', 'attachment_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'created_at', 'updated_at', 'attachment_url', 'attachment_name',
        ]
        extra_kwargs = {
            'attachment': {
                'write_only': True,
                'required': False,
                'allow_null': True,
            },
        }

    def get_attachment_url(self, obj):
        if not obj.attachment:
            return None
        request = self.context.get('request')
        url = obj.attachment.url
        return request.build_absolute_uri(url) if request else url

    def get_attachment_name(self, obj):
        if not obj.attachment:
            return None
        return obj.attachment.name.rsplit('/', 1)[-1]

    def validate_attachment(self, value):
        if value is None:
            return value
        allowed = {'.pdf', '.txt'}
        name = value.name.lower()
        if not any(name.endswith(ext) for ext in allowed):
            raise serializers.ValidationError('Only PDF and TXT files are allowed.')
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError('Attachment must be 10 MB or smaller.')
        return value

    def validate(self, data):
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        status_value = data.get('status', getattr(self.instance, 'status', 'ongoing'))

        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({'end_date': 'End date cannot be before the start date.'})

        if status_value == 'completed' and not end_date:
            raise serializers.ValidationError({'end_date': 'Completed experiments should have an end date.'})

        return data


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
