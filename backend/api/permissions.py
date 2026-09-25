from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdmin(BasePermission):
    """
    Allows access only to users with role == 'admin'.
    """
    message = 'You must be an administrator to perform this action.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == 'admin'
        )


class IsAdminOrReadOnly(BasePermission):
    """
    Safe (read) methods are allowed for any authenticated user.
    Write methods require role == 'admin'.
    """
    message = 'You must be an administrator to modify this resource.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role == 'admin'


class ExperimentPermission(BasePermission):
    """
    Experiment rules:
    - Any authenticated user can view experiments.
    - Any authenticated user can register/create an experiment.
    - Admins have full create/update/delete authority.
    - Regular users cannot edit or delete experiments after creation.
    """
    message = 'You must be an administrator to modify an existing experiment.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        if request.method == 'POST':
            return True
        return request.user.role == 'admin'
