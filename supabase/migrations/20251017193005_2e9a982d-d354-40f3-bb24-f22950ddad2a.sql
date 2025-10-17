-- Make slug columns nullable to handle Open5e data that may not have slugs
ALTER TABLE srd_documents ALTER COLUMN slug DROP NOT NULL;
ALTER TABLE srd_feats ALTER COLUMN slug DROP NOT NULL;
ALTER TABLE srd_conditions ALTER COLUMN slug DROP NOT NULL;
ALTER TABLE srd_magic_items ALTER COLUMN slug DROP NOT NULL;
ALTER TABLE srd_planes ALTER COLUMN slug DROP NOT NULL;
ALTER TABLE srd_sections ALTER COLUMN slug DROP NOT NULL;