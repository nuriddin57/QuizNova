from django.contrib.auth import authenticate
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import StudentProfile, TeacherProfile, User


class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = ('university', 'faculty', 'semester', 'group', 'student_id')


class TeacherProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherProfile
        fields = ('university', 'department', 'employee_id', 'subject_area')


class UserSerializer(serializers.ModelSerializer):
    student_profile = StudentProfileSerializer(read_only=True)
    teacher_profile = TeacherProfileSerializer(read_only=True)
    field_of_study_name = serializers.CharField(source='field_of_study.name', read_only=True)
    assigned_field_names = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'full_name',
            'first_name',
            'last_name',
            'role',
            'student_id',
            'field_of_study',
            'field_of_study_name',
            'semester_code',
            'semester_number',
            'section',
            'department',
            'teacher_department',
            'teacher_designation',
            'assigned_fields',
            'assigned_field_names',
            'assigned_semester_codes',
            'assigned_semester_numbers',
            'academic_year',
            'is_verified',
            'university_domain_verified',
            'is_staff',
            'is_active',
            'student_profile',
            'teacher_profile',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'assigned_field_names',
            'created_at',
            'updated_at',
        )

    def get_assigned_field_names(self, obj):
        return [field.name for field in obj.assigned_fields.all()]


class UserSummarySerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'role', 'is_active', 'is_staff', 'profile', 'created_at')

    def get_profile(self, obj):
        if obj.is_student():
            return StudentProfileSerializer(obj.student_profile).data if hasattr(obj, 'student_profile') else None
        return TeacherProfileSerializer(obj.teacher_profile).data if hasattr(obj, 'teacher_profile') else None


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    full_name = serializers.CharField(required=False, allow_blank=True, max_length=255)
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES)
    student_profile = StudentProfileSerializer(required=False)
    teacher_profile = TeacherProfileSerializer(required=False)

    def validate_email(self, value):
        email = User.objects.normalize_email(value)
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return email

    def validate(self, attrs):
        role = attrs['role']
        if role == User.ROLE_STUDENT and not attrs.get('student_profile'):
            raise serializers.ValidationError({'student_profile': 'Student profile is required for student accounts.'})
        if role in {User.ROLE_TEACHER, User.ROLE_ADMIN} and not attrs.get('teacher_profile'):
            raise serializers.ValidationError({'teacher_profile': 'Teacher profile is required for teacher/admin accounts.'})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        student_profile_data = validated_data.pop('student_profile', None)
        teacher_profile_data = validated_data.pop('teacher_profile', None)
        password = validated_data.pop('password')
        role = validated_data['role']
        user = User.objects.create_user(
            password=password,
            is_verified=True,
            university_domain_verified=True,
            **validated_data,
        )
        if role == User.ROLE_STUDENT and student_profile_data:
            profile = user.student_profile
            for field, value in student_profile_data.items():
                setattr(profile, field, value)
            profile.save()
        if role in {User.ROLE_TEACHER, User.ROLE_ADMIN} and teacher_profile_data:
            profile = user.teacher_profile
            for field, value in teacher_profile_data.items():
                setattr(profile, field, value)
            profile.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    default_error_messages = {
        'invalid_credentials': 'Invalid email or password.',
        'inactive': 'User account is inactive.',
    }

    def validate(self, attrs):
        email = User.objects.normalize_email(attrs.get('email'))
        password = attrs.get('password')
        user = authenticate(
            request=self.context.get('request'),
            username=email,
            password=password,
        )
        if not user:
            self.fail('invalid_credentials')
        if not user.is_active:
            self.fail('inactive')
        attrs['user'] = user
        return attrs

    def to_representation(self, instance):
        user = instance['user'] if isinstance(instance, dict) else instance
        refresh = RefreshToken.for_user(user)
        refresh['role'] = user.role
        refresh['email'] = user.email
        access = refresh.access_token
        return {
            'access': str(access),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        }


class MeUpdateSerializer(serializers.ModelSerializer):
    student_profile = StudentProfileSerializer(required=False)
    teacher_profile = TeacherProfileSerializer(required=False)

    class Meta:
        model = User
        fields = (
            'full_name',
            'first_name',
            'last_name',
            'field_of_study',
            'semester_code',
            'semester_number',
            'section',
            'teacher_department',
            'teacher_designation',
            'department',
            'student_profile',
            'teacher_profile',
        )

    @transaction.atomic
    def update(self, instance, validated_data):
        student_profile_data = validated_data.pop('student_profile', None)
        teacher_profile_data = validated_data.pop('teacher_profile', None)

        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()

        if student_profile_data is not None and hasattr(instance, 'student_profile'):
            for field, value in student_profile_data.items():
                setattr(instance.student_profile, field, value)
            instance.student_profile.save()

        if teacher_profile_data is not None and hasattr(instance, 'teacher_profile'):
            for field, value in teacher_profile_data.items():
                setattr(instance.teacher_profile, field, value)
            instance.teacher_profile.save()

        return instance


class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()
    new_password = serializers.CharField(write_only=True, min_length=8)

    def save(self):
        email = User.objects.normalize_email(self.validated_data['email'])
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            raise serializers.ValidationError({'email': 'User not found.'})
        user.set_password(self.validated_data['new_password'])
        user.save(update_fields=['password'])
        return user


class UserManagementSerializer(serializers.ModelSerializer):
    student_profile = StudentProfileSerializer(required=False)
    teacher_profile = TeacherProfileSerializer(required=False)

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'full_name',
            'first_name',
            'last_name',
            'role',
            'is_active',
            'is_staff',
            'is_verified',
            'university_domain_verified',
            'field_of_study',
            'semester_code',
            'semester_number',
            'section',
            'teacher_department',
            'teacher_designation',
            'department',
            'assigned_fields',
            'assigned_semester_codes',
            'assigned_semester_numbers',
            'academic_year',
            'student_profile',
            'teacher_profile',
        )

    @transaction.atomic
    def create(self, validated_data):
        password = self.initial_data.get('password')
        if not password:
            raise serializers.ValidationError({'password': 'Password is required.'})
        serializer = RegisterSerializer(data={**self.initial_data})
        serializer.is_valid(raise_exception=True)
        return serializer.save()

    @transaction.atomic
    def update(self, instance, validated_data):
        student_profile_data = validated_data.pop('student_profile', None)
        teacher_profile_data = validated_data.pop('teacher_profile', None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()

        if student_profile_data is not None and hasattr(instance, 'student_profile'):
            for field, value in student_profile_data.items():
                setattr(instance.student_profile, field, value)
            instance.student_profile.save()

        if teacher_profile_data is not None and hasattr(instance, 'teacher_profile'):
            for field, value in teacher_profile_data.items():
                setattr(instance.teacher_profile, field, value)
            instance.teacher_profile.save()

        password = self.initial_data.get('password')
        if password:
            instance.set_password(password)
            instance.save(update_fields=['password'])
        return instance
