-- CreateTable
CREATE TABLE "student_faces" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "mine_type" TEXT NOT NULL,
    "image" TEXT NOT NULL,

    CONSTRAINT "student_faces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_faces_student_id_key" ON "student_faces"("student_id");

-- AddForeignKey
ALTER TABLE "student_faces" ADD CONSTRAINT "student_faces_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
