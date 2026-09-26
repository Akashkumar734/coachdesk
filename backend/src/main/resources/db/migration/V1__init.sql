-- CoachDesk schema v1

CREATE TABLE teacher (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(100) NOT NULL,
    institute_name  VARCHAR(150),
    phone           VARCHAR(20),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE batch (
    id           BIGSERIAL PRIMARY KEY,
    teacher_id   BIGINT        NOT NULL REFERENCES teacher (id) ON DELETE CASCADE,
    name         VARCHAR(100)  NOT NULL,
    subject      VARCHAR(100),
    timing       VARCHAR(100),
    monthly_fee  NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (monthly_fee >= 0),
    active       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX idx_batch_teacher ON batch (teacher_id);

CREATE TABLE student (
    id            BIGSERIAL PRIMARY KEY,
    teacher_id    BIGINT        NOT NULL REFERENCES teacher (id) ON DELETE CASCADE,
    batch_id      BIGINT        REFERENCES batch (id) ON DELETE SET NULL,
    name          VARCHAR(100)  NOT NULL,
    phone         VARCHAR(20),
    parent_name   VARCHAR(100),
    parent_phone  VARCHAR(20),
    join_date     DATE          NOT NULL,
    monthly_fee   NUMERIC(10, 2) CHECK (monthly_fee >= 0),  -- NULL = use the batch fee
    active        BOOLEAN       NOT NULL DEFAULT TRUE,
    notes         TEXT,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX idx_student_teacher ON student (teacher_id);
CREATE INDEX idx_student_batch ON student (batch_id);

CREATE TABLE attendance (
    id          BIGSERIAL PRIMARY KEY,
    teacher_id  BIGINT  NOT NULL REFERENCES teacher (id) ON DELETE CASCADE,
    student_id  BIGINT  NOT NULL REFERENCES student (id) ON DELETE CASCADE,
    att_date    DATE    NOT NULL,
    present     BOOLEAN NOT NULL,
    CONSTRAINT uq_attendance_student_date UNIQUE (student_id, att_date)
);
CREATE INDEX idx_attendance_teacher_date ON attendance (teacher_id, att_date);

CREATE TABLE fee_payment (
    id          BIGSERIAL PRIMARY KEY,
    teacher_id  BIGINT         NOT NULL REFERENCES teacher (id) ON DELETE CASCADE,
    student_id  BIGINT         NOT NULL REFERENCES student (id) ON DELETE CASCADE,
    fee_month   VARCHAR(7)     NOT NULL,          -- format YYYY-MM
    amount      NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    paid_on     DATE           NOT NULL,
    mode        VARCHAR(20)    NOT NULL,          -- CASH, UPI, BANK, OTHER
    note        VARCHAR(255),
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT now()
);
CREATE INDEX idx_fee_teacher_month ON fee_payment (teacher_id, fee_month);
CREATE INDEX idx_fee_student ON fee_payment (student_id);
