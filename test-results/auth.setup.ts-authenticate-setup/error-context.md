# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "본문으로 바로가기" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - link "본문으로 바로가기" [ref=e3] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e5]:
    - generic [ref=e6]:
      - generic [ref=e7]:
        - img [ref=e8]
        - heading "내책" [level=1] [ref=e11]
      - paragraph [ref=e12]: 교사가 만드는 디지털 교과서
    - generic [ref=e14]:
      - button "Google Google로 계속하기" [ref=e15] [cursor=pointer]:
        - img "Google" [ref=e16]
        - generic [ref=e17]: Google로 계속하기
      - paragraph [ref=e18]: 계정이 없으면 자동으로 회원가입됩니다
      - generic [ref=e23]: 또는
      - button "이메일로 로그인하기" [ref=e24] [cursor=pointer]:
        - img [ref=e25]
        - generic [ref=e28]: 이메일로 로그인하기
        - img [ref=e29]
      - generic [ref=e31]:
        - paragraph [ref=e32]:
          - text: 이메일로 새 계정을 만드시려면
          - link "회원가입" [ref=e33] [cursor=pointer]:
            - /url: /auth/signup
        - link "홈으로 돌아가기" [ref=e34] [cursor=pointer]:
          - /url: /
  - alert [ref=e37]
```