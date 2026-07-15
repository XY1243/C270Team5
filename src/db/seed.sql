-- Dev seed data. All seeded accounts use the password: Password123!

INSERT INTO users (name, email, password_hash, role, status)
VALUES ('Admin Ada', 'admin@example.com', '$2b$10$.53MztpX7NqPTHLu5VgcV.f6.IbMB3f0lxi7A8Kcld2/ZW0e0JHm6', 'admin', 'active');

INSERT INTO users (name, email, password_hash, role, status)
VALUES ('Owen Organiser', 'organiser@example.com', '$2b$10$.53MztpX7NqPTHLu5VgcV.f6.IbMB3f0lxi7A8Kcld2/ZW0e0JHm6', 'organiser', 'active');

INSERT INTO events (organiser_id, title, description, category, venue_name, lat, lng, starts_at, ends_at, capacity, status)
SELECT id, 'Community Tech Meetup', 'A casual meetup for local developers.', 'tech', 'Marina Bay Sands', 1.2834000, 103.8607000, DATE_ADD(NOW(), INTERVAL 7 DAY), DATE_ADD(NOW(), INTERVAL 7 DAY) + INTERVAL 2 HOUR, 50, 'approved'
FROM users WHERE email = 'organiser@example.com';

INSERT INTO events (organiser_id, title, description, category, venue_name, lat, lng, starts_at, ends_at, capacity, status)
SELECT id, 'Pop Culture Festival', 'A massive celebration of movies, games, and art.', 'arts', 'Universal Studios Singapore', 1.2540000, 103.8238000, DATE_ADD(NOW(), INTERVAL 45 DAY), DATE_ADD(NOW(), INTERVAL 45 DAY) + INTERVAL 10 HOUR, 500, 'pending'
FROM users WHERE email = 'organiser@example.com';

INSERT INTO events (organiser_id, title, description, category, venue_name, lat, lng, starts_at, ends_at, capacity, status)
SELECT id, 'Global Travel Expo', 'Showcasing the latest in travel and aviation.', 'exhibition', 'Changi Airport', 1.3644000, 103.9915000, DATE_ADD(NOW(), INTERVAL 30 DAY), DATE_ADD(NOW(), INTERVAL 30 DAY) + INTERVAL 8 HOUR, 300, 'approved'
FROM users WHERE email = 'organiser@example.com';