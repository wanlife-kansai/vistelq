// 運営者情報（公開前に環境変数で設定してください）
//   NEXT_PUBLIC_OPERATOR_NAME   運営者名（個人名・屋号など）
//   NEXT_PUBLIC_CONTACT_EMAIL   お問い合わせ用メールアドレス
export function getOperator() {
  return {
    name: process.env.NEXT_PUBLIC_OPERATOR_NAME || "",
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  };
}
