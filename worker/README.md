# 99days AI 프록시 (Cloudflare Worker)

프론트엔드(GitHub Pages)가 이 Worker를 통해 Claude API를 호출합니다. 실제 Anthropic API 키는
이 Worker의 secret으로만 저장되고, 플레이어의 브라우저에는 절대 노출되지 않습니다. 자세한 배경은
[docs/design/04-ai-gamemaster-prompt.md](../docs/design/04-ai-gamemaster-prompt.md) 참고.

## 최초 1회 설정

```bash
cd worker
npm install
```

1. **Anthropic API 키 발급**: https://console.anthropic.com 에서 발급.

2. **Cloudflare 계정 로그인** (브라우저 OAuth 창이 뜹니다):
   ```bash
   npx wrangler login
   ```

3. **레이트리밋용 KV 네임스페이스 생성**:
   ```bash
   npx wrangler kv namespace create RATE_LIMIT
   ```
   출력된 `id = "..."` 값을 `wrangler.toml`의 `REPLACE_WITH_KV_NAMESPACE_ID` 자리에 붙여넣습니다.

4. **API 키를 secret으로 저장** (git에 커밋되지 않음):
   ```bash
   npx wrangler secret put ANTHROPIC_API_KEY
   ```
   프롬프트가 뜨면 1번에서 발급받은 키를 붙여넣습니다.

5. **배포**:
   ```bash
   npx wrangler deploy
   ```
   배포 후 출력되는 `https://99days-ai-proxy.<subdomain>.workers.dev` 형태의 URL을 복사합니다.

6. **프론트엔드에 Worker URL 연결**:
   - 로컬 개발: 저장소 루트에 `.env` 파일을 만들고 `EXPO_PUBLIC_AI_WORKER_URL=<위에서 복사한 URL>` 추가 (`.env.example` 참고).
   - GitHub Pages 배포: 저장소 Settings → Secrets and variables → Actions → Variables 탭에서
     `EXPO_PUBLIC_AI_WORKER_URL` 리포지토리 변수를 추가 (`.github/workflows/deploy.yml`이 빌드 시 사용).

7. (선택) `wrangler.toml`의 `ALLOWED_ORIGIN`을 배포된 GitHub Pages 주소(예:
   `https://<user>.github.io`)로 좁혀서 다른 사이트가 이 Worker를 가져다 쓰지 못하게 할 수 있습니다.

## 로컬에서 테스트

```bash
npx wrangler dev --local
```

`http://127.0.0.1:8787/turn`으로 POST 요청을 보내 확인할 수 있습니다 (요청 형식은 `src/index.ts`의
`isPlausibleTurnContext` 참고).

## 비용/남용 방지

- 기본 모델은 `claude-haiku-4-5-20251001` (저비용/저지연). `wrangler.toml`의 `ANTHROPIC_MODEL`로 교체 가능.
- `DAILY_LIMIT` (기본 50)만큼 IP/세션당 하루 호출을 제한합니다 (`RATE_LIMIT` KV 사용).
- Worker가 죽거나 예산이 소진되어도 프론트엔드는 자동으로 오프라인 폴백 생성기로 전환되어 게임이 끊기지 않습니다.
