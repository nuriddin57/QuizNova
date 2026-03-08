from django.db import models


class Subject(models.Model):
    name = models.CharField(max_length=180)
    code = models.CharField(max_length=40, unique=True)
    description = models.TextField(blank=True)
    programme = models.ForeignKey(
        'fields.Programme',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='subjects',
    )
    field_of_study = models.ForeignKey(
        'fields.StudyField',
        on_delete=models.CASCADE,
        related_name='subjects',
    )
    department = models.CharField(max_length=160, blank=True)
    semester = models.PositiveSmallIntegerField(default=1)
    semester_code = models.CharField(max_length=20, blank=True)
    credits = models.PositiveSmallIntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['field_of_study__name', 'semester', 'code', 'name']
        unique_together = ('field_of_study', 'semester', 'code')

    def __str__(self):
        return f'{self.code} - {self.name}'


class Topic(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='topics')
    name = models.CharField(max_length=180)
    description = models.TextField(blank=True)
    unit_name = models.CharField(max_length=180, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['subject__code', 'unit_name', 'name']
        unique_together = ('subject', 'name', 'unit_name')

    def __str__(self):
        if self.unit_name:
            return f'{self.subject.code}: {self.unit_name} / {self.name}'
        return f'{self.subject.code}: {self.name}'


class Module(models.Model):
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=180)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['topic__subject__code', 'topic__name', 'order', 'title']
        unique_together = ('topic', 'title')

    def __str__(self):
        return f'{self.topic.subject.code}: {self.topic.name} / {self.title}'
