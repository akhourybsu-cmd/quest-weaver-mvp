
-- Seed Arcane Trickster (Rogue) and Eldritch Knight (Fighter) subclasses
INSERT INTO srd_subclasses (id, name, class_id, description, unlock_level)
VALUES 
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Eldritch Knight', '550e8400-e29b-41d4-a716-446655440005', 'The Eldritch Knight combines martial prowess with arcane magic, learning to cast wizard spells while wielding weapons and wearing armor.', 3),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Arcane Trickster', '550e8400-e29b-41d4-a716-446655440009', 'The Arcane Trickster enhances stealth and agility with enchantment and illusion magic, learning to cast wizard spells focused on misdirection and trickery.', 3)
ON CONFLICT (id) DO NOTHING;
