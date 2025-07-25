-- Seed data for the smart traffic system

-- Insert sample users
INSERT INTO users (email, name, role, points, level) VALUES
('admin@kottakkal.gov.in', 'Traffic Admin', 'admin', 5000, 10),
('officer1@kottakkal.gov.in', 'Rajesh Kumar', 'officer', 2500, 5),
('citizen1@example.com', 'Priya Nair', 'citizen', 1250, 3),
('driver1@example.com', 'Suresh Menon', 'driver', 800, 2);

-- Insert sample vehicles
INSERT INTO vehicles (id, type, status, driver_name, contact_number, coordinates) VALUES
('AMB-001', 'ambulance', 'active', 'Dr. Rajesh Kumar', '+91-9876543210', POINT(75.9064, 10.9847)),
('AMB-002', 'ambulance', 'active', 'Nurse Priya', '+91-9876543211', POINT(75.9080, 10.9860)),
('FIRE-001', 'fire', 'active', 'Suresh Nair', '+91-9876543212', POINT(75.9050, 10.9830)),
('BUS-001', 'school_bus', 'active', 'Ravi Kumar', '+91-9876543213', POINT(75.9070, 10.9850)),
('BUS-002', 'school_bus', 'active', 'Meera Devi', '+91-9876543214', POINT(75.9090, 10.9870)),
('CITY-001', 'city_bus', 'active', 'Anil Kumar', '+91-9876543215', POINT(75.9060, 10.9840)),
('CITY-002', 'city_bus', 'active', 'Lakshmi Nair', '+91-9876543216', POINT(75.9100, 10.9880));

-- Insert sample traffic zones
INSERT INTO traffic_zones (name, zone_type, coordinates, max_capacity) VALUES
('Main Market Area', 'commercial', 
 ST_GeomFromText('POLYGON((75.905 10.983, 75.908 10.983, 75.908 10.986, 75.905 10.986, 75.905 10.983))', 4326), 
 50),
('School Zone', 'school', 
 ST_GeomFromText('POLYGON((75.906 10.984, 75.909 10.984, 75.909 10.987, 75.906 10.987, 75.906 10.984))', 4326), 
 30),
('Hospital Area', 'hospital', 
 ST_GeomFromText('POLYGON((75.904 10.982, 75.907 10.982, 75.907 10.985, 75.904 10.985, 75.904 10.982))', 4326), 
 40),
('Residential Area', 'residential', 
 ST_GeomFromText('POLYGON((75.907 10.985, 75.910 10.985, 75.910 10.988, 75.907 10.988, 75.907 10.985))', 4326), 
 60);

-- Insert sample routes
INSERT INTO routes (name, route_type, coordinates, vehicle_types, schedule) VALUES
('School Route A', 'school_bus', 
 ST_GeomFromText('LINESTRING(75.905 10.983, 75.906 10.984, 75.907 10.985, 75.908 10.986)', 4326),
 ARRAY['school_bus'],
 '{"morning": ["07:00", "07:30", "08:00"], "evening": ["15:00", "15:30", "16:00"]}'),
('City Bus Route 1', 'city_bus',
 ST_GeomFromText('LINESTRING(75.904 10.982, 75.906 10.984, 75.908 10.986, 75.910 10.988)', 4326),
 ARRAY['city_bus'],
 '{"frequency": "15 minutes", "start": "06:00", "end": "22:00"}'),
('Emergency Route', 'emergency',
 ST_GeomFromText('LINESTRING(75.905 10.983, 75.907 10.985, 75.909 10.987)', 4326),
 ARRAY['ambulance', 'fire'],
 '{"priority": "high", "always_active": true}');

-- Insert sample pickup points
INSERT INTO pickup_points (name, coordinates, point_type, route_id, schedule_times, facilities) VALUES
('Government School Main Gate', POINT(75.906, 10.984), 'school', 
 (SELECT id FROM routes WHERE name = 'School Route A'), 
 ARRAY['07:30'::TIME, '15:30'::TIME], 
 ARRAY['shelter', 'bench']),
('Market Bus Stop', POINT(75.905, 10.983), 'bus_stop', 
 (SELECT id FROM routes WHERE name = 'City Bus Route 1'), 
 ARRAY['06:00'::TIME, '06:15'::TIME, '06:30'::TIME], 
 ARRAY['shelter', 'digital_display']),
('Hospital Emergency', POINT(75.904, 10.982), 'emergency', 
 (SELECT id FROM routes WHERE name = 'Emergency Route'), 
 NULL, 
 ARRAY['emergency_access', '24x7']);

-- Insert sample incidents
INSERT INTO incidents (id, type, coordinates, description, severity, votes, reported_by) VALUES
('INC-001', 'accident', POINT(75.907, 10.985), 'Minor collision between two vehicles near market', 'medium', 5,
 (SELECT id FROM users WHERE email = 'citizen1@example.com')),
('INC-002', 'congestion', POINT(75.908, 10.986), 'Heavy traffic due to school hours', 'high', 12,
 (SELECT id FROM users WHERE email = 'officer1@kottakkal.gov.in')),
('INC-003', 'roadblock', POINT(75.909, 10.987), 'Road maintenance work blocking one lane', 'medium', 8,
 (SELECT id FROM users WHERE email = 'driver1@example.com'));

-- Insert sample achievements
INSERT INTO user_achievements (user_id, achievement_type, achievement_data, points_awarded) VALUES
((SELECT id FROM users WHERE email = 'citizen1@example.com'), 'first_report', 
 '{"incident_id": "INC-001", "description": "First incident report"}', 100),
((SELECT id FROM users WHERE email = 'citizen1@example.com'), 'helpful_citizen', 
 '{"reports_validated": 5, "description": "5 reports validated by community"}', 250),
((SELECT id FROM users WHERE email = 'officer1@kottakkal.gov.in'), 'traffic_monitor', 
 '{"incidents_resolved": 15, "description": "Resolved 15 traffic incidents"}', 500);

-- Update user badges based on achievements
UPDATE users SET badges = ARRAY['First Reporter', 'Traffic Helper'] 
WHERE email = 'citizen1@example.com';

UPDATE users SET badges = ARRAY['Traffic Officer', 'Problem Solver', 'Community Leader'] 
WHERE email = 'officer1@kottakkal.gov.in';
