import { MigrationInterface, QueryRunner } from "typeorm";

export class Exercise1792397117358 implements MigrationInterface {
    name = 'Exercise1792397117358'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "exercise" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying(50) NOT NULL, "body_part" character varying(20) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_4420597915e901ab5d6f2bcaee4" UNIQUE ("name"), CONSTRAINT "PK_a0f107e3a2ef2742c1e91d97c14" PRIMARY KEY ("id"))`);
        // 기존 web 코드(EXERCISE_CATALOG)에 있던 기본 종목
        await queryRunner.query(`INSERT INTO "exercise" ("body_part", "name") VALUES
            ('가슴', '벤치프레스'), ('가슴', '인클라인 벤치프레스'), ('가슴', '덤벨 프레스'), ('가슴', '체스트 프레스 머신'), ('가슴', '펙덱 플라이'), ('가슴', '푸시업'),
            ('등', '데드리프트'), ('등', '랫풀다운'), ('등', '바벨 로우'), ('등', '시티드 로우'), ('등', '풀업'), ('등', '원암 덤벨 로우'),
            ('하체', '스쿼트'), ('하체', '레그 프레스'), ('하체', '런지'), ('하체', '레그 익스텐션'), ('하체', '레그 컬'), ('하체', '루마니안 데드리프트'), ('하체', '힙 쓰러스트'),
            ('어깨', '오버헤드 프레스'), ('어깨', '사이드 레터럴 레이즈'), ('어깨', '리어 델트 플라이'), ('어깨', '덤벨 숄더 프레스'),
            ('팔', '바벨 컬'), ('팔', '덤벨 컬'), ('팔', '해머 컬'), ('팔', '케이블 푸시다운'), ('팔', '라잉 트라이셉스 익스텐션'),
            ('코어', '플랭크'), ('코어', '크런치'), ('코어', '행잉 레그 레이즈'), ('코어', '케이블 크런치')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "exercise"`);
    }

}
