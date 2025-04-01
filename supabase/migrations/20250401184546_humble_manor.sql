/*
  # Property Applications Schema

  1. New Tables
    - `property_applications`
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key to properties)
      - `applicant_id` (uuid, foreign key to auth.users)
      - `email` (text)
      - `phone` (text)
      - `message` (text)
      - `status` (text) - 'pending', 'approved', 'rejected'
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `property_applications` table
    - Add policies for applicants to create applications
    - Add policies for property owners to view applications for their properties
*/

CREATE TABLE IF NOT EXISTS property_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) NOT NULL,
  applicant_id uuid REFERENCES auth.users(id) NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE property_applications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to create applications
CREATE POLICY "Users can create applications"
  ON property_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = applicant_id);

-- Allow users to view their own applications
CREATE POLICY "Users can view their own applications"
  ON property_applications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = applicant_id);

-- Allow property owners to view applications for their properties
CREATE POLICY "Property owners can view applications for their properties"
  ON property_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_applications.property_id
      AND properties.owner_id = auth.uid()
    )
  );