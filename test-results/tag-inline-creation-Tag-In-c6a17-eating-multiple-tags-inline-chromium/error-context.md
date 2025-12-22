# Page snapshot

```yaml
- generic [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - heading "Welcome back" [level=1] [ref=e6]
        - generic [ref=e7]: Sign in to your FinanceFlow account
      - generic [ref=e9]:
        - generic [ref=e10]:
          - generic [ref=e11]: Email
          - textbox "Email" [active] [ref=e12]:
            - /placeholder: name@example.com
          - paragraph [ref=e13]: Invalid email address
        - generic [ref=e14]:
          - generic [ref=e15]: Password
          - textbox "Password" [ref=e16]:
            - /placeholder: Enter your password
          - paragraph [ref=e17]: Password is required
        - button "Sign in" [ref=e18]
        - paragraph [ref=e19]:
          - text: Don't have an account?
          - link "Sign up" [ref=e20] [cursor=pointer]:
            - /url: /signup
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e26] [cursor=pointer]:
    - img [ref=e27]
  - alert [ref=e30]
```