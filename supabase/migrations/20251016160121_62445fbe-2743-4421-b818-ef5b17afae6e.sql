-- RPC function to create a complete character in a single transaction
CREATE OR REPLACE FUNCTION create_character_full(payload JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_character_id UUID;
  v_skill JSONB;
  v_prof JSONB;
  v_lang JSONB;
  v_feat JSONB;
  v_equip JSONB;
  v_spell JSONB;
BEGIN
  -- 1. Insert main character record
  INSERT INTO characters (
    user_id,
    campaign_id,
    name,
    class,
    level,
    ancestry_id,
    subancestry_id,
    background_id,
    subclass_id,
    proficiency_bonus,
    max_hp,
    current_hp,
    ac,
    speed,
    size,
    hit_die,
    hit_dice_total,
    hit_dice_current,
    spell_ability,
    spell_save_dc,
    spell_attack_mod,
    passive_perception,
    str_save,
    dex_save,
    con_save,
    int_save,
    wis_save,
    cha_save,
    alignment,
    age,
    height,
    weight,
    eyes,
    skin,
    hair,
    notes,
    creation_status
  ) VALUES (
    (payload->>'user_id')::UUID,
    (payload->>'campaign_id')::UUID,
    payload->>'name',
    payload->>'className',
    (payload->>'level')::INTEGER,
    (payload->>'ancestryId')::UUID,
    (payload->>'subancestryId')::UUID,
    (payload->>'backgroundId')::UUID,
    (payload->>'subclassId')::UUID,
    (payload->>'proficiencyBonus')::INTEGER,
    (payload->>'maxHp')::INTEGER,
    (payload->>'maxHp')::INTEGER, -- current_hp starts at max
    (payload->>'ac')::INTEGER,
    (payload->>'speed')::INTEGER,
    payload->>'size',
    payload->>'hitDie',
    (payload->>'level')::INTEGER, -- hit_dice_total
    (payload->>'level')::INTEGER, -- hit_dice_current
    payload->>'spellAbility',
    (payload->>'spellSaveDC')::INTEGER,
    (payload->>'spellAttackMod')::INTEGER,
    (payload->>'passivePerception')::INTEGER,
    (payload->'savingThrows'->>'str')::INTEGER,
    (payload->'savingThrows'->>'dex')::INTEGER,
    (payload->'savingThrows'->>'con')::INTEGER,
    (payload->'savingThrows'->>'int')::INTEGER,
    (payload->'savingThrows'->>'wis')::INTEGER,
    (payload->'savingThrows'->>'cha')::INTEGER,
    payload->>'alignment',
    payload->>'age',
    payload->>'height',
    payload->>'weight',
    payload->>'eyes',
    payload->>'skin',
    payload->>'hair',
    payload->>'notes',
    'complete'
  ) RETURNING id INTO v_character_id;

  -- 2. Insert ability scores
  INSERT INTO character_abilities (
    character_id,
    str, dex, con, int, wis, cha,
    method
  ) VALUES (
    v_character_id,
    (payload->'abilityScores'->>'str')::INTEGER,
    (payload->'abilityScores'->>'dex')::INTEGER,
    (payload->'abilityScores'->>'con')::INTEGER,
    (payload->'abilityScores'->>'int')::INTEGER,
    (payload->'abilityScores'->>'wis')::INTEGER,
    (payload->'abilityScores'->>'cha')::INTEGER,
    COALESCE(payload->>'abilityMethod', 'standard-array')
  );

  -- 3. Insert saving throw proficiencies
  INSERT INTO character_saves (
    character_id,
    str, dex, con, int, wis, cha
  ) VALUES (
    v_character_id,
    COALESCE((payload->'saveProficiencies'->>'str')::BOOLEAN, false),
    COALESCE((payload->'saveProficiencies'->>'dex')::BOOLEAN, false),
    COALESCE((payload->'saveProficiencies'->>'con')::BOOLEAN, false),
    COALESCE((payload->'saveProficiencies'->>'int')::BOOLEAN, false),
    COALESCE((payload->'saveProficiencies'->>'wis')::BOOLEAN, false),
    COALESCE((payload->'saveProficiencies'->>'cha')::BOOLEAN, false)
  );

  -- 4. Insert skills
  IF payload ? 'skills' THEN
    FOR v_skill IN SELECT * FROM jsonb_array_elements(payload->'skills')
    LOOP
      INSERT INTO character_skills (
        character_id,
        skill,
        proficient,
        expertise
      ) VALUES (
        v_character_id,
        v_skill->>'name',
        COALESCE((v_skill->>'proficient')::BOOLEAN, false),
        COALESCE((v_skill->>'expertise')::BOOLEAN, false)
      );
    END LOOP;
  END IF;

  -- 5. Insert proficiencies (armor, weapons, tools)
  IF payload ? 'proficiencies' THEN
    FOR v_prof IN SELECT * FROM jsonb_array_elements(payload->'proficiencies')
    LOOP
      INSERT INTO character_proficiencies (
        character_id,
        type,
        name
      ) VALUES (
        v_character_id,
        v_prof->>'type',
        v_prof->>'name'
      );
    END LOOP;
  END IF;

  -- 6. Insert languages
  IF payload ? 'languages' THEN
    FOR v_lang IN SELECT * FROM jsonb_array_elements(payload->'languages')
    LOOP
      INSERT INTO character_languages (
        character_id,
        name
      ) VALUES (
        v_character_id,
        v_lang->>'name'
      );
    END LOOP;
  END IF;

  -- 7. Insert features
  IF payload ? 'features' THEN
    FOR v_feat IN SELECT * FROM jsonb_array_elements(payload->'features')
    LOOP
      INSERT INTO character_features (
        character_id,
        name,
        source,
        level,
        description,
        data
      ) VALUES (
        v_character_id,
        v_feat->>'name',
        v_feat->>'source',
        (v_feat->>'level')::INTEGER,
        v_feat->>'description',
        COALESCE(v_feat->'data', '{}'::JSONB)
      );
    END LOOP;
  END IF;

  -- 8. Insert equipment
  IF payload ? 'equipment' THEN
    FOR v_equip IN SELECT * FROM jsonb_array_elements(payload->'equipment')
    LOOP
      INSERT INTO character_equipment (
        character_id,
        item_ref,
        qty,
        equipped,
        data
      ) VALUES (
        v_character_id,
        v_equip->>'item_ref',
        COALESCE((v_equip->>'qty')::INTEGER, 1),
        COALESCE((v_equip->>'equipped')::BOOLEAN, false),
        COALESCE(v_equip->'data', '{}'::JSONB)
      );
    END LOOP;
  END IF;

  -- 9. Insert spells
  IF payload ? 'spells' THEN
    FOR v_spell IN SELECT * FROM jsonb_array_elements(payload->'spells')
    LOOP
      INSERT INTO character_spells (
        character_id,
        spell_id,
        source,
        prepared,
        known
      ) VALUES (
        v_character_id,
        (v_spell->>'spell_id')::UUID,
        COALESCE(v_spell->>'source', 'class'),
        COALESCE((v_spell->>'prepared')::BOOLEAN, false),
        COALESCE((v_spell->>'known')::BOOLEAN, true)
      );
    END LOOP;
  END IF;

  RETURN v_character_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_character_full(JSONB) TO authenticated;