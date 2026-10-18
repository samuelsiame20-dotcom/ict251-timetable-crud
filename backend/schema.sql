-- ICT251 Activity 4 — Question 3: Student Timetable & Goals
-- Database: PostgreSQL (Supabase). Run this once in the Supabase SQL Editor.

DROP TABLE IF EXISTS timetable;

CREATE TABLE timetable (
    id           SERIAL PRIMARY KEY,                 -- auto-increment
    course_code  VARCHAR(20)  NOT NULL,
    course_name  VARCHAR(150),
    lecturer     VARCHAR(120),
    day_of_week  VARCHAR(10)  NOT NULL
                 CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
    start_time   TIME         NOT NULL,
    end_time     TIME         NOT NULL,
    venue        VARCHAR(80),
    weekly_goal  TEXT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_time_order CHECK (end_time > start_time)
);

-- Postgres has no "ON UPDATE CURRENT_TIMESTAMP" like MySQL, so a trigger does it.
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_timetable_updated_at
BEFORE UPDATE ON timetable
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Sample data (13 records)
INSERT INTO timetable (course_code, course_name, lecturer, day_of_week, start_time, end_time, venue, weekly_goal) VALUES
('ICT261', 'Advanced Java Programming', 'Mr E Nyirenda', 'Monday',    '11:00', '13:00', 'Lab 2',  'Finish the JavaFX lab exercises'),
('PHY101', 'College Physics I',          NULL,            'Monday',    '15:00', '17:00', 'LT 1',   'Do 10 end-of-chapter problems'),
('ICT221', 'Computer Architecture',      NULL,            'Tuesday',   '07:00', '09:00', 'LT 3',   'Revise pipelining and hazards'),
('ICT241', 'Digital Design',             NULL,            'Tuesday',   '15:00', '17:00', 'Lab 1',  'Simplify 3 K-maps without help'),
('ICT221', 'Computer Architecture',      NULL,            'Wednesday', '07:00', '09:00', 'LT 3',   'Summarise the cache memory notes'),
('MSM111', 'Mathematical Methods I',     NULL,            'Wednesday', '09:00', '11:00', 'LT 2',   'Complete the tutorial sheet'),
('ICT241', 'Digital Design',             NULL,            'Wednesday', '11:00', '13:00', 'Lab 1',  'Build a full adder in the simulator'),
('ICT261', 'Advanced Java Programming', 'Mr E Nyirenda', 'Wednesday', '15:00', '17:00', 'Lab 2',  'Set up Maven for the group project'),
('MSM111', 'Mathematical Methods I',     NULL,            'Thursday',  '07:00', '09:00', 'LT 2',   'Practise integration by parts'),
('ICT261', 'Advanced Java Programming', 'Mr E Nyirenda', 'Thursday',  '09:00', '11:00', 'Lab 2',  'Refactor the lodge billing UI'),
('PHY101', 'College Physics I',          NULL,            'Thursday',  '15:00', '17:00', 'LT 1',   'Review kinematics formulas'),
('ICT251', 'Web Technologies',           NULL,            'Friday',    '11:00', '13:00', 'Lab 3',  'Deploy the Node.js CRUD app'),
('ICT261', 'Advanced Java Programming', 'Mr E Nyirenda', 'Saturday',  '11:00', '15:00', 'Lab 2',  'Attend both sessions, ask about exams');
