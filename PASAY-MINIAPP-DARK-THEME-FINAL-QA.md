Exit code: 0
Wall time: 0.1 seconds
Output:
# PASAY-MINIAPP-DARK-THEME-FINAL-QA

- Result: **FAIL (0/10 PASS)**
- Browser: Google Chrome (connected real browser)
- Target: `pasay-dark-qa-390-430.html`
- OpenDesign project: `pasay-rm` (`c5fb3a39-c6d0-4003-9cee-66deb7a626a1`)
- Scope: Home / Property / Queue / Finance / Detail 脳 390px / 430px
- Mutation policy: No design or code changes made.

## Observed result

The page's own real-browser QA summary reported:

`REAL-BROWSER QA (dark 路 390/430) 路 Home/Property/Queue/Finance/Detail 路 total=10 pass=0 allPass=false`

All 10 rows failed the `docOverflow` and `瑁佸垏/鐭Е杈綻 checks. `appOverflow`, text overlap, BottomNav5, dark theme, and leak checks passed in every row.

## Evidence

- `pasay-dark-qa-chrome-390.png`
- `pasay-dark-qa-chrome-430.png`

Final acceptance criterion `10/10 PASS` was not met. Work stopped without changing the product.

