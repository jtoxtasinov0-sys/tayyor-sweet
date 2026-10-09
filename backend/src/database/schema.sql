-- Tayyor & Sweet — baza sxemasi (har ishga tushganda xavfsiz qayta bajariladi)

CREATE TABLE IF NOT EXISTS images (
  id          SERIAL PRIMARY KEY,
  mime        TEXT NOT NULL,
  data        BYTEA NOT NULL,
  source      TEXT,                      -- masalan: rasmlar/01_paxlava.jpg
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id          BIGINT PRIMARY KEY,        -- Telegram ID
  first_name  TEXT,
  last_name   TEXT,
  username    TEXT,
  phone       TEXT,
  lang        TEXT,                      -- 'uz' | 'ru'
  is_admin    BOOLEAN NOT NULL DEFAULT false,
  bot_blocked BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  name_uz     TEXT NOT NULL,
  name_ru     TEXT,
  emoji       TEXT,
  sort        INT NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS products (
  id             SERIAL PRIMARY KEY,
  category_id    INT REFERENCES categories(id) ON DELETE SET NULL,
  name_uz        TEXT NOT NULL,
  name_ru        TEXT,
  description_uz TEXT,
  description_ru TEXT,
  unit_uz        TEXT,                   -- "2 dona", "1 bo'lak", "1 kg"
  unit_ru        TEXT,
  price          INT NOT NULL DEFAULT 0, -- vonda (₩)
  old_price      INT,
  image_id       INT REFERENCES images(id) ON DELETE SET NULL,
  gallery        INT[] NOT NULL DEFAULT '{}',
  frame          JSONB NOT NULL DEFAULT '{"x":50,"y":50,"zoom":1}',
  variants       JSONB NOT NULL DEFAULT '[]', -- o'lchamlar: [{name, price}]
  colors         JSONB NOT NULL DEFAULT '[]', -- rang variantlari: [{name, hex}]
  size_table     JSONB NOT NULL DEFAULT '[]', -- [{size, diameter, weight, servings}]
  badge          TEXT,                   -- 'hit' | 'new' | 'sale'
  preorder_days  INT NOT NULL DEFAULT 0, -- tortlar 2–3 kun oldin
  in_stock       BOOLEAN NOT NULL DEFAULT true,
  active         BOOLEAN NOT NULL DEFAULT true,
  sort           INT NOT NULL DEFAULT 0,
  source         TEXT UNIQUE,            -- papkadan yuklanganda fayl nomi
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stories (
  id          SERIAL PRIMARY KEY,
  title       TEXT,
  text        TEXT,
  image_id    INT REFERENCES images(id) ON DELETE SET NULL,
  product_id  INT REFERENCES products(id) ON DELETE CASCADE,
  active      BOOLEAN NOT NULL DEFAULT true,
  sort        INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS banners (
  id          SERIAL PRIMARY KEY,
  title       TEXT,
  subtitle    TEXT,
  image_id    INT REFERENCES images(id) ON DELETE SET NULL,
  product_id  INT REFERENCES products(id) ON DELETE SET NULL,
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  active      BOOLEAN NOT NULL DEFAULT true,
  sort        INT NOT NULL DEFAULT 0
);

-- Buyurtma holatlari:
-- pending_payment → receipt_sent → confirmed → shipped → delivered  (yoki cancelled)
CREATE TABLE IF NOT EXISTS orders (
  id               SERIAL PRIMARY KEY,
  number           TEXT NOT NULL UNIQUE,
  user_id          BIGINT REFERENCES users(id) ON DELETE SET NULL,
  items            JSONB NOT NULL,
  subtotal         INT NOT NULL,
  delivery_fee     INT NOT NULL DEFAULT 0,
  total            INT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending_payment',
  delivery_method  TEXT NOT NULL,        -- 'taekbae' | 'bus' | 'pickup'
  customer_name    TEXT NOT NULL,
  phone            TEXT NOT NULL,
  address          TEXT,
  postal_code      TEXT,
  desired_date     DATE,
  comment          TEXT,
  receipt_image_id INT REFERENCES images(id) ON DELETE SET NULL,
  courier          TEXT,                 -- 'cj' | 'epost' | 'hanjin' | 'lotte' | 'logen'
  tracking_number  TEXT,
  admin_note       TEXT,
  history          JSONB NOT NULL DEFAULT '[]',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_user_idx ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);

CREATE TABLE IF NOT EXISTS settings (
  key    TEXT PRIMARY KEY,
  value  JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS broadcasts (
  id          SERIAL PRIMARY KEY,
  text        TEXT NOT NULL,
  image_id    INT REFERENCES images(id) ON DELETE SET NULL,
  button      TEXT,
  total       INT NOT NULL DEFAULT 0,
  sent        INT NOT NULL DEFAULT 0,
  failed      INT NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'running',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
