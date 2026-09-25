from django.db import models
from django.contrib.auth.models import AbstractUser


class CustomUser(AbstractUser):
    """
    Extended user model with a role field.
    """
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('user', 'User'),
    ]
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='user',
        help_text='Designates the role of this user within LabTrack.',
    )

    def __str__(self):
        return f"{self.username} ({self.role})"

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'


class Equipment(models.Model):
    """
    Represents a piece of lab equipment available for reservation.
    """
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('in_use', 'In Use'),
        ('maintenance', 'Maintenance'),
    ]

    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    description = models.TextField(blank=True, default='')
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='available',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']
        verbose_name = 'Equipment'
        verbose_name_plural = 'Equipment'


class Reservation(models.Model):
    """
    A time-bound booking of a piece of equipment by a user.
    Conflict-checking is enforced at the serializer/view layer.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]

    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.CASCADE,
        related_name='reservations',
    )
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='reservations',
    )
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
    )
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} — {self.equipment.name} [{self.start_time:%Y-%m-%d %H:%M} → {self.end_time:%H:%M}]"

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Reservation'
        verbose_name_plural = 'Reservations'


class Experiment(models.Model):
    """
    A research experiment being run in the lab — ongoing or completed.
    Deliberately has no foreign keys (kept decoupled from Equipment/User)
    to avoid any migration-ordering issues.
    """
    STATUS_CHOICES = [
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed'),
    ]

    title = models.CharField(max_length=200)
    category = models.CharField(max_length=100, blank=True, default='')
    description = models.TextField(blank=True, default='')
    lead_researcher = models.CharField(max_length=150, blank=True, default='')
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='ongoing',
    )
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)  # null while ongoing
    outcome = models.TextField(blank=True, default='')
    equipment_used = models.ManyToManyField(
        Equipment,
        blank=True,
        related_name='experiments',
    )
    attachment = models.FileField(
        upload_to='experiment_files/',
        blank=True,
        null=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} [{self.status}]"

    class Meta:
        ordering = ['-start_date']
        verbose_name = 'Experiment'
        verbose_name_plural = 'Experiments'
