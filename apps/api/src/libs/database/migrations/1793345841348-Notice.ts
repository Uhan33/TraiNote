import { MigrationInterface, QueryRunner } from "typeorm";

export class Notice1793345841348 implements MigrationInterface {
    name = 'Notice1793345841348'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "notice" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "title" character varying(100) NOT NULL, "trainer_body" text, "member_body" text, "posted_on" date NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_705062b14410ff1a04998f86d72" PRIMARY KEY ("id"))`);
        // 첫 공지 2개 (이후 공지는 운영자가 추가)
        await queryRunner.query(`INSERT INTO "notice" ("title", "trainer_body", "member_body", "posted_on") VALUES
            ('TraiNote 베타 테스트를 시작합니다', $n$안녕하세요, 트레이너를 위한 PT 운동일지 TraiNote 입니다.

오늘부터 베타 테스트를 시작합니다.

· 회원별 운동일지를 작성하면 회원이 가입 없이 회원 코드만으로 바로 확인할 수 있어요
· 회원 체중·체성분을 기록하고 그래프로 변화를 볼 수 있어요
· 남은 PT 횟수를 관리할 수 있어요
· 휴대폰 홈 화면에 추가하면 앱처럼 쓸 수 있어요

베타 기간 동안 불편한 점이나 필요한 기능을 내 정보 > 문의하기로 남겨 주세요. 하나씩 반영해 나갈게요.$n$, $n$안녕하세요, PT 운동일지 TraiNote 입니다.

오늘부터 베타 테스트를 시작합니다.

· 담당 트레이너가 작성한 운동일지를 가입 없이 회원 코드만으로 볼 수 있어요
· 체중·체성분 변화를 그래프로 확인할 수 있어요
· 휴대폰 홈 화면에 추가하면 앱처럼 쓸 수 있어요

이용하면서 불편한 점이 있으면 담당 트레이너에게 말씀해 주세요.$n$, '2026-10-17'),
            ('개인운동 기능이 추가됐어요', $n$회원이 PT 없는 날 혼자 운동한 내용을 직접 기록할 수 있게 됐어요.

· 하단 개인운동 탭에서 회원별 기록을 날짜순으로 볼 수 있어요
· 새로 올라온 기록은 탭과 회원 목록에 따로 표시돼요
· 기록을 열어 댓글로 바로 피드백할 수 있어요
· 회원이 기록하거나 댓글을 달면 알림으로도 알려 드려요

개인운동 기록은 PT 남은 횟수와 성장 그래프에는 반영되지 않아요.$n$, $n$PT 없는 날 혼자 운동한 것도 기록할 수 있게 됐어요.

· 하단 개인운동 탭에서 운동 기록하기를 눌러 시작해요
· 운동 종목과 함께 컨디션, 느낀 점, 궁금한 점을 자유롭게 적을 수 있어요
· 트레이너가 기록을 보고 댓글로 피드백해 드려요
· 지난 날짜도 골라서 기록할 수 있어요$n$, '2026-10-30')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "notice"`);
    }

}
