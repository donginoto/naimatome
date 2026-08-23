# NAI VAULT — 설치 안내

아티스트 태그를 모아두고, 태그 줄을 한 번 눌러 `artist:이름`을 복사하는 개인 갤러리입니다.
아래 순서대로 하면 30분 안에 내 주소가 생깁니다. 코드는 건드릴 일이 없습니다.

---

## 1. 데이터 보관소 만들기 (Supabase, 무료)

1. supabase.com 에 가입하고 **New project**를 만듭니다. (Region은 Northeast Asia (Seoul) 추천)
2. 비밀번호를 정하고 프로젝트가 다 만들어질 때까지 1~2분 기다립니다.
3. 왼쪽 메뉴 **SQL Editor** → **New query** → 이 폴더의 `supabase-setup.sql` 내용을 통째로 붙여넣고 **Run**.
   → 표 하나와 그림 저장소 하나가 만들어집니다.
4. 왼쪽 메뉴 **Authentication** → **Users** → **Add user** → **Create new user**
   → 쓸 이메일과 비밀번호를 넣고 만듭니다. **이게 나중에 로그인할 계정입니다.**
   (Auto Confirm User 항목이 있으면 켜주세요.)
5. 왼쪽 메뉴 **Project Settings** → **API** 에서 두 값을 복사해 둡니다.
   - **Project URL**
   - **anon public** 키

---

## 2. 내 컴퓨터에서 먼저 확인하기 (건너뛰어도 됨)

```bash
npm install
```

`.env.local.example` 파일 이름을 `.env.local`로 바꾸고, 위에서 복사한 두 값을 넣습니다.

```bash
npm run dev
```

http://localhost:3000 에서 4번에서 만든 계정으로 들어가집니다.

---

## 3. 인터넷에 올리기 (Vercel, 무료)

1. 이 폴더를 GitHub에 새 저장소로 올립니다.
   (`node_modules`와 `.env.local`은 `.gitignore`에 들어 있어 자동으로 빠집니다.)
2. vercel.com 에 GitHub 계정으로 가입 → **Add New → Project** → 방금 만든 저장소를 고릅니다.
3. **Environment Variables** 칸에 두 줄을 넣습니다.

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | 복사해둔 Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 복사해둔 anon public 키 |

4. **Deploy**를 누릅니다. 1~2분 뒤 `내이름.vercel.app` 주소가 나옵니다.

이후로는 GitHub에 올린 코드가 바뀔 때마다 알아서 다시 배포됩니다.

---

## 쓰는 법

- **새 항목** — 아티스트 이름, 스타일 태그(쉼표로 구분), 그림 파일을 넣고 저장.
  태그는 미리 정해둘 필요 없이 그때그때 새로 적으면 목록에 자동으로 늘어납니다.
- **복사** — 카드 아래 `artist:이름` 줄을 누르면 바로 클립보드에 들어갑니다. 모바일도 같습니다.
- **거르기** — 위쪽 스타일 목록에서 여러 개를 고르면 전부 해당하는 항목만 남습니다.
  카드 아래 작은 태그를 눌러도 같은 필터가 걸립니다.
- **고치기 / 지우기** — 그림 오른쪽 위 `고치기`를 누르면 됩니다. (모바일은 항상 보입니다)

## 알아둘 것

- 그림은 누구나 볼 수 있는 주소에 저장되지만, 갤러리 자체는 로그인해야 열립니다.
  주소를 아는 사람에게 그림이 노출되면 곤란하다면 Supabase에서 `artworks` 저장소를
  비공개로 바꾸고 서명된 주소를 쓰도록 고쳐야 합니다.
- 계정을 더 만들고 싶으면 Supabase의 Authentication → Users에서 추가하면 됩니다.
- 무료 한도: Supabase 저장소 1GB, Vercel 대역폭 월 100GB. 개인용으로는 넉넉합니다.
