from django.db import models


class ActiveSingletonQuerySet(models.QuerySet):
    def deactivate_others(self, instance):
        if instance.is_active:
            self.exclude(pk=instance.pk).filter(is_active=True).update(is_active=False)


class Testimonial(models.Model):
    ROLE_TEACHER = 'teacher'
    ROLE_STUDENT = 'student'
    ROLE_PARENT = 'parent'
    ROLE_SCHOOL_ADMIN = 'school_admin'

    ROLE_CHOICES = [
        (ROLE_TEACHER, 'Teacher'),
        (ROLE_STUDENT, 'Student'),
        (ROLE_PARENT, 'Parent'),
        (ROLE_SCHOOL_ADMIN, 'School admin'),
    ]

    name = models.CharField(max_length=120)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    school = models.CharField(max_length=160)
    quote = models.TextField()
    quote_uz = models.TextField(blank=True)
    quote_ru = models.TextField(blank=True)
    quote_en = models.TextField(blank=True)
    avatar = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at', 'name']

    def __str__(self):
        return f'{self.name} ({self.get_role_display()})'


class WeeklyChallengeQuerySet(ActiveSingletonQuerySet):
    pass


class WeeklyChallenge(models.Model):
    title = models.CharField(max_length=180)
    title_uz = models.CharField(max_length=180, blank=True)
    title_ru = models.CharField(max_length=180, blank=True)
    title_en = models.CharField(max_length=180, blank=True)
    description = models.TextField()
    description_uz = models.TextField(blank=True)
    description_ru = models.TextField(blank=True)
    description_en = models.TextField(blank=True)
    reward = models.CharField(max_length=180)
    reward_uz = models.CharField(max_length=180, blank=True)
    reward_ru = models.CharField(max_length=180, blank=True)
    reward_en = models.CharField(max_length=180, blank=True)
    deadline = models.DateTimeField()
    code = models.CharField(max_length=32, unique=True)
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = WeeklyChallengeQuerySet.as_manager()

    class Meta:
        ordering = ['-is_active', 'deadline', '-created_at']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        WeeklyChallenge.objects.deactivate_others(self)

