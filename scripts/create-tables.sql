-- Create database tables for the smart traffic system

-- Users table for authentication and gamification
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'citizen',
    points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    badges TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id VARCHAR(50) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    driver_name VARCHAR(255),
    contact_number VARCHAR(20),
    route_info TEXT,
    coordinates POINT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Incidents table
CREATE TABLE IF NOT EXISTS incidents (
    id VARCHAR(50) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    coordinates POINT NOT NULL,
    description TEXT,
    severity VARCHAR(20) DEFAULT 'medium',
    votes INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    reported_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicle locations history for analytics
CREATE TABLE IF NOT EXISTS vehicle_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id VARCHAR(50) REFERENCES vehicles(id),
    coordinates POINT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    speed FLOAT,
    heading FLOAT
);

-- Traffic zones for congestion management
CREATE TABLE IF NOT EXISTS traffic_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    zone_type VARCHAR(50) NOT NULL,
    coordinates POLYGON NOT NULL,
    congestion_level FLOAT DEFAULT 0,
    max_capacity INTEGER,
    current_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Routes and pickup points
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    route_type VARCHAR(50) NOT NULL,
    coordinates LINESTRING NOT NULL,
    vehicle_types TEXT[] DEFAULT '{}',
    schedule JSONB,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pickup/drop points for buses
CREATE TABLE IF NOT EXISTS pickup_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    coordinates POINT NOT NULL,
    point_type VARCHAR(50) NOT NULL,
    route_id UUID REFERENCES routes(id),
    schedule_times TIME[],
    facilities TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Incident votes for validation
CREATE TABLE IF NOT EXISTS incident_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id VARCHAR(50) REFERENCES incidents(id),
    user_id UUID REFERENCES users(id),
    vote_type VARCHAR(10) CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(incident_id, user_id)
);

-- User achievements and badges
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    achievement_type VARCHAR(100) NOT NULL,
    achievement_data JSONB,
    points_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_coordinates ON vehicles USING GIST (coordinates);
CREATE INDEX IF NOT EXISTS idx_incidents_coordinates ON incidents USING GIST (coordinates);
CREATE INDEX IF NOT EXISTS idx_vehicle_locations_timestamp ON vehicle_locations (timestamp);
CREATE INDEX IF NOT EXISTS idx_vehicle_locations_vehicle_id ON vehicle_locations (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_traffic_zones_coordinates ON traffic_zones USING GIST (coordinates);
CREATE INDEX IF NOT EXISTS idx_routes_coordinates ON routes USING GIST (coordinates);
CREATE INDEX IF NOT EXISTS idx_pickup_points_coordinates ON pickup_points USING GIST (coordinates);

-- Enable PostGIS extension for spatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create functions for real-time updates
CREATE OR REPLACE FUNCTION update_vehicle_location(
    p_vehicle_id VARCHAR(50),
    p_coordinates POINT,
    p_speed FLOAT DEFAULT NULL,
    p_heading FLOAT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    -- Update vehicle current location
    UPDATE vehicles 
    SET coordinates = p_coordinates, 
        last_updated = NOW()
    WHERE id = p_vehicle_id;
    
    -- Insert into location history
    INSERT INTO vehicle_locations (vehicle_id, coordinates, speed, heading)
    VALUES (p_vehicle_id, p_coordinates, p_speed, p_heading);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate traffic congestion
CREATE OR REPLACE FUNCTION calculate_zone_congestion(zone_id UUID) 
RETURNS FLOAT AS $$
DECLARE
    vehicle_count INTEGER;
    max_capacity INTEGER;
    congestion_level FLOAT;
BEGIN
    SELECT max_capacity INTO max_capacity FROM traffic_zones WHERE id = zone_id;
    
    SELECT COUNT(*) INTO vehicle_count 
    FROM vehicles v, traffic_zones tz 
    WHERE tz.id = zone_id 
    AND ST_Within(v.coordinates, tz.coordinates);
    
    IF max_capacity > 0 THEN
        congestion_level := LEAST(vehicle_count::FLOAT / max_capacity, 1.0);
    ELSE
        congestion_level := 0;
    END IF;
    
    UPDATE traffic_zones 
    SET congestion_level = congestion_level, 
        current_count = vehicle_count 
    WHERE id = zone_id;
    
    RETURN congestion_level;
END;
$$ LANGUAGE plpgsql;
