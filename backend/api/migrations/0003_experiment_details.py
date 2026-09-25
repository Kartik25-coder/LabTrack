from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_experiment'),
    ]

    operations = [
        migrations.AddField(
            model_name='experiment',
            name='outcome',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='experiment',
            name='attachment',
            field=models.FileField(blank=True, null=True, upload_to='experiment_files/'),
        ),
        migrations.AddField(
            model_name='experiment',
            name='equipment_used',
            field=models.ManyToManyField(blank=True, related_name='experiments', to='api.equipment'),
        ),
    ]
