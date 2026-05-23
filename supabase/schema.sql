-- ============================================================
-- Mae Phuchuay Farm - Supabase Database Schema
-- วิธีใช้: Copy ทั้งหมดแล้วรันใน Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Table: farm_records (บันทึกข้อมูลฟาร์ม)
-- ============================================================
CREATE TABLE IF NOT EXISTS farm_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- วันที่
  date DATE NOT NULL,
  year INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM date)::INTEGER) STORED,
  month INTEGER GENERATED ALWAYS AS (EXTRACT(MONTH FROM date)::INTEGER) STORED,

  -- ประเภทและโรงเรือน
  record_type TEXT NOT NULL DEFAULT 'ผลผลิตประจำวัน',
  -- ค่าที่เป็นไปได้: 'ผลผลิตประจำวัน', 'ลงทุนเริ่มต้น/อุปกรณ์', 'ซื้ออาหาร', 'ค่าใช้จ่ายอื่นๆ'
  coop TEXT NOT NULL DEFAULT 'เล้า A',

  -- ข้อมูลไก่และไข่
  num_hens INTEGER DEFAULT 0,
  good_eggs INTEGER DEFAULT 0,
  broken_eggs INTEGER DEFAULT 0,
  eggs_sold INTEGER DEFAULT 0,
  price_per_egg DECIMAL(10,2) DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,

  -- ข้อมูลอาหาร
  feed_used DECIMAL(10,2) DEFAULT 0,
  feed_purchased DECIMAL(10,2) DEFAULT 0,
  feed_remaining DECIMAL(10,2) DEFAULT 0,
  feed_cost DECIMAL(10,2) DEFAULT 0,

  -- ค่าใช้จ่าย
  utilities_cost DECIMAL(10,2) DEFAULT 0,
  other_expenses DECIMAL(10,2) DEFAULT 0,
  investment DECIMAL(10,2) DEFAULT 0,
  total_expenses DECIMAL(10,2) DEFAULT 0,
  profit DECIMAL(10,2) DEFAULT 0,

  -- สุขภาพไก่
  dead_hens INTEGER DEFAULT 0,
  production_rate DECIMAL(5,2) DEFAULT 0,

  -- หมายเหตุ
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index สำหรับ query ที่ใช้บ่อย
CREATE INDEX IF NOT EXISTS idx_farm_records_date ON farm_records(date DESC);
CREATE INDEX IF NOT EXISTS idx_farm_records_user_date ON farm_records(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_farm_records_record_type ON farm_records(record_type);
CREATE INDEX IF NOT EXISTS idx_farm_records_coop ON farm_records(coop);

-- ============================================================
-- Row Level Security (RLS) - ปกป้องข้อมูล
-- ============================================================
ALTER TABLE farm_records ENABLE ROW LEVEL SECURITY;

-- ผู้ใช้เห็นเฉพาะข้อมูลของตัวเอง
CREATE POLICY "Users can view own records" ON farm_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records" ON farm_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own records" ON farm_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own records" ON farm_records
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- Function: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_farm_records_updated_at
  BEFORE UPDATE ON farm_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Function: คำนวณสรุปรายเดือน (View)
-- ============================================================
CREATE OR REPLACE VIEW monthly_summary AS
SELECT
  user_id,
  year,
  month,
  coop,
  SUM(good_eggs) AS total_good_eggs,
  SUM(broken_eggs) AS total_broken_eggs,
  SUM(eggs_sold) AS total_eggs_sold,
  SUM(revenue) AS total_revenue,
  SUM(feed_cost) AS total_feed_cost,
  SUM(utilities_cost) AS total_utilities,
  SUM(other_expenses) AS total_other_expenses,
  SUM(investment) AS total_investment,
  SUM(total_expenses) AS total_expenses,
  SUM(profit) AS total_profit,
  SUM(dead_hens) AS total_dead_hens,
  AVG(CASE WHEN num_hens > 0 THEN production_rate ELSE NULL END) AS avg_production_rate,
  COUNT(*) FILTER (WHERE record_type = 'ผลผลิตประจำวัน') AS days_recorded
FROM farm_records
GROUP BY user_id, year, month, coop;

-- ============================================================
-- ข้อมูลตัวอย่างจาก Google Sheets (ไม่บังคับ - ลบออกได้)
-- หมายเหตุ: ต้องใส่ user_id จริงก่อน insert
-- ============================================================
-- INSERT INTO farm_records (...) VALUES (...);
