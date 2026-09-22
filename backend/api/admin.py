from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Equipment, Reservation


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'role', 'first_name', 'last_name', 'is_staff', 'date_joined']
    list_filter = ['role', 'is_staff', 'is_active']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-date_joined']

    fieldsets = UserAdmin.fieldsets + (
        ('LabTrack Role', {'fields': ('role',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('LabTrack Role', {'fields': ('role',)}),
    )


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'status', 'created_at', 'updated_at']
    list_filter = ['status', 'category']
    search_fields = ['name', 'category', 'description']
    list_editable = ['status']
    ordering = ['name']

    fieldsets = [
        (None, {'fields': ['name', 'category', 'description', 'status']}),
        ('Timestamps', {'fields': ['created_at', 'updated_at'], 'classes': ['collapse']}),
    ]
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'equipment', 'start_time', 'end_time', 'status', 'created_at']
    list_filter = ['status', 'equipment', 'user']
    search_fields = ['user__username', 'equipment__name', 'notes']
    date_hierarchy = 'start_time'
    ordering = ['-created_at']
    raw_id_fields = ['user', 'equipment']

    fieldsets = [
        ('Reservation', {'fields': ['user', 'equipment', 'start_time', 'end_time', 'status', 'notes']}),
        ('Timestamps', {'fields': ['created_at', 'updated_at'], 'classes': ['collapse']}),
    ]
    readonly_fields = ['created_at', 'updated_at']
