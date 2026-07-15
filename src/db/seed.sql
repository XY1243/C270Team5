-- Dev seed data. All seeded accounts use the password: Password123!

INSERT INTO users (name, email, password_hash, role, status)
VALUES ('Admin Ada', 'admin@example.com', '$2b$10$.53MztpX7NqPTHLu5VgcV.f6.IbMB3f0lxi7A8Kcld2/ZW0e0JHm6', 'admin', 'active');

INSERT INTO users (name, email, password_hash, role, status)
VALUES ('Owen Organiser', 'organiser@example.com', '$2b$10$.53MztpX7NqPTHLu5VgcV.f6.IbMB3f0lxi7A8Kcld2/ZW0e0JHm6', 'organiser', 'active');

INSERT INTO events (organiser_id, title, description, category, venue_name, lat, lng, starts_at, ends_at, capacity, status)
SELECT id, 'Community Tech Meetup', 'A casual meetup for local developers.', 'tech', 'Downtown Hub', 1.3025, 103.8354, DATE_ADD(NOW(), INTERVAL 7 DAY), DATE_ADD(NOW(), INTERVAL 7 DAY) + INTERVAL 2 HOUR, 50, 'approved'
FROM users WHERE email = 'organiser@example.com';

INSERT INTO events (organiser_id, title, description, category, venue_name, lat, lng, starts_at, ends_at, capacity, status)
SELECT id, 'Weekend Art Fair', 'Local artists showcase their work.', 'arts', 'City Park', 1.2847, 103.8610, DATE_ADD(NOW(), INTERVAL 14 DAY), DATE_ADD(NOW(), INTERVAL 14 DAY) + INTERVAL 4 HOUR, 100, 'pending'
FROM users WHERE email = 'organiser@example.com';

