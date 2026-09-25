from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from api.models import CustomUser, Equipment, Reservation, Experiment


class Command(BaseCommand):
    help = 'Seeds the database with sample users, equipment, and reservations for demo purposes.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING('\n🔬  LabTrack — Seeding database...\n'))

        # ── Admin user ────────────────────────────────────────
        if not CustomUser.objects.filter(username='admin').exists():
            CustomUser.objects.create_superuser(
                username='admin',
                email='admin@labtrack.com',
                password='Admin@123',
                role='admin',
                first_name='Lab',
                last_name='Admin',
            )
            self.stdout.write(self.style.SUCCESS('✔ Created admin user:    admin / Admin@123'))
        else:
            self.stdout.write('  Admin user already exists, skipping.')

        admin_user = CustomUser.objects.get(username='admin')

        # ── Test user ─────────────────────────────────────────
        if not CustomUser.objects.filter(username='testuser').exists():
            CustomUser.objects.create_user(
                username='testuser',
                email='testuser@labtrack.com',
                password='User@123',
                role='user',
                first_name='Test',
                last_name='User',
            )
            self.stdout.write(self.style.SUCCESS('✔ Created test user:     testuser / User@123'))
        else:
            self.stdout.write('  Test user already exists, skipping.')

        test_user = CustomUser.objects.get(username='testuser')

        # ── Equipment items ───────────────────────────────────
        equipment_data = [
            {
                'name': 'Olympus BX53 Microscope',
                'category': 'Optical Equipment',
                'description': 'High-performance upright microscope supporting brightfield, phase contrast, DIC, and fluorescence imaging. Equipped with 4×–100× objective lenses.',
                'status': 'available',
            },
            {
                'name': 'Eppendorf 5425R Centrifuge',
                'category': 'Separation Equipment',
                'description': 'Refrigerated microcentrifuge reaching speeds up to 25,000 × g. Ideal for DNA, RNA, and protein separations in molecular biology workflows.',
                'status': 'available',
            },
            {
                'name': 'PerkinElmer UV-Vis Spectrometer',
                'category': 'Analytical Equipment',
                'description': 'UV-Visible spectrophotometer covering the 190–1100 nm range. Used for quantification of DNA, RNA, proteins, and small molecules.',
                'status': 'available',
            },
            {
                'name': 'Bio-Rad CFX96 PCR Machine',
                'category': 'Molecular Biology',
                'description': '96-well real-time thermal cycler supporting standard PCR and qPCR. Currently undergoing annual calibration service.',
                'status': 'maintenance',
            },
            {
                'name': 'Tektronix MDO3104 Oscilloscope',
                'category': 'Electronics Lab',
                'description': '4-channel mixed-domain oscilloscope with 1 GHz bandwidth and built-in spectrum analyser for RF signal characterisation.',
                'status': 'available',
            },
        ]

        created_equipment = []
        for eq_data in equipment_data:
            eq, created = Equipment.objects.get_or_create(
                name=eq_data['name'],
                defaults=eq_data,
            )
            created_equipment.append(eq)
            status_icon = '✔' if created else '·'
            verb = 'Created' if created else 'Exists '
            self.stdout.write(self.style.SUCCESS(f'{status_icon} {verb} equipment:  {eq.name}'))

        # ── Sample reservations ───────────────────────────────
        now = timezone.now()

        if not Reservation.objects.filter(user=test_user).exists():
            # Future reservation — pending
            Reservation.objects.create(
                equipment=created_equipment[0],   # Microscope
                user=test_user,
                start_time=now + timedelta(hours=3),
                end_time=now + timedelta(hours=5),
                status='pending',
                notes='Imaging session for bacterial culture slide samples.',
            )
            # Another future reservation — pending
            Reservation.objects.create(
                equipment=created_equipment[1],   # Centrifuge
                user=test_user,
                start_time=now + timedelta(days=1),
                end_time=now + timedelta(days=1, hours=2),
                status='pending',
                notes='Protein extraction spin-down.',
            )
            # Past completed reservation
            Reservation.objects.create(
                equipment=created_equipment[2],   # Spectrometer
                user=test_user,
                start_time=now - timedelta(days=2),
                end_time=now - timedelta(days=2) + timedelta(hours=1),
                status='completed',
                notes='Absorbance reading for plasmid yield check.',
            )
            self.stdout.write(self.style.SUCCESS('✔ Created sample reservations for testuser.'))
        else:
            self.stdout.write('  Sample reservations already exist, skipping.')

        # ── Experiments ────────────────────────────────────────
        experiment_data = [
            {
                'title': 'Application-Specific Cycling of Automotive-Grade Cells',
                'outcome': 'Completed cycling showed measurable internal-resistance growth under the automotive duty profile, with degradation concentrated in the high-temperature cycles.',
                'category': 'Battery Cycling',
                'lead_researcher': 'Dr. M. Fischer',
                'status': 'completed',
                'start_date': now.date() - timedelta(days=120),
                'end_date': now.date() - timedelta(days=30),
                'description': (
                    'Cells cycled under charge/discharge profiles mimicking real automotive duty '
                    'cycles at controlled temperatures, paired with EIS (Electrochemical Impedance '
                    'Spectroscopy) inspections to track internal resistance changes over the test period.'
                ),
            },
            {
                'title': 'Second-Life Capacity Assessment — Retired E-Bike Packs',
                'outcome': 'Most candidate packs retained sufficient usable capacity for lower-demand second-life applications after screening; weak cells were excluded from redeployment.',
                'category': 'Battery Cycling',
                'lead_researcher': 'Dr. L. Meier',
                'status': 'completed',
                'start_date': now.date() - timedelta(days=90),
                'end_date': now.date() - timedelta(days=45),
                'description': (
                    'Fast measurement cycling on used e-bike battery packs to quickly determine '
                    'remaining usable capacity, identifying cells suitable for redeployment in '
                    'less demanding second-life applications.'
                ),
            },
            {
                'title': 'ORP-EIS Diagnostic Monitoring on Sensorized Test Cells',
                'outcome': 'Ongoing monitoring is being used to correlate pressure, strain, ultrasound, and impedance changes as early indicators of degradation.',
                'category': 'Battery Diagnostics',
                'lead_researcher': 'Dr. A. Rossi',
                'status': 'ongoing',
                'start_date': now.date() - timedelta(days=25),
                'end_date': None,
                'description': (
                    'Long-term cycling of cells fitted with embedded pressure, strain, and ultrasound '
                    'sensors, using Odd Random Phase EIS (ORP-EIS) to detect early degradation signs '
                    'before they surface as measurable capacity loss.'
                ),
            },
            {
                'title': 'Thin-Film Lithium-Metal Anode Fabrication Trials',
                'outcome': 'Initial fabrication runs produced testable thin-film anodes; cycling results are still being collected and compared across deposition conditions.',
                'category': 'Materials Research',
                'lead_researcher': 'Dr. S. Keller',
                'status': 'ongoing',
                'start_date': now.date() - timedelta(days=10),
                'end_date': None,
                'description': (
                    'Thermal evaporation deposition of lithium-metal anodes onto copper current '
                    'collectors under dry-room conditions, followed by assembly into pouch cells '
                    'for early-stage cycling evaluation.'
                ),
            },
        ]

        equipment_links = {
            'Application-Specific Cycling of Automotive-Grade Cells': [created_equipment[0], created_equipment[2]],
            'Second-Life Capacity Assessment — Retired E-Bike Packs': [created_equipment[0]],
            'ORP-EIS Diagnostic Monitoring on Sensorized Test Cells': [created_equipment[2], created_equipment[3]],
            'Thin-Film Lithium-Metal Anode Fabrication Trials': [created_equipment[1]],
        }

        for exp_data in experiment_data:
            exp, created = Experiment.objects.get_or_create(
                title=exp_data['title'],
                defaults=exp_data,
            )
            exp.equipment_used.set(equipment_links.get(exp.title, []))
            if not exp.outcome and exp_data.get('outcome'):
                exp.outcome = exp_data['outcome']
                exp.save(update_fields=['outcome', 'updated_at'])
            status_icon = '✔' if created else '·'
            verb = 'Created' if created else 'Exists '
            self.stdout.write(self.style.SUCCESS(f'{status_icon} {verb} experiment: {exp.title}'))

        self.stdout.write(self.style.MIGRATE_HEADING('\n✅  Seeding complete!\n'))
        self.stdout.write('  Admin credentials :  admin     /  Admin@123')
        self.stdout.write('  User  credentials :  testuser  /  User@123\n')
