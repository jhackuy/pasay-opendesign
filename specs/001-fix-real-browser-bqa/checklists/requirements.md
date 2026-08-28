# Specification Quality Checklist: Fix Real-Browser BQA on Windows Chrome 151 (390 / 430)

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-28
**Feature**: `specs/001-fix-real-browser-bqa/spec.md`

## Content Quality

- [x] No implementation details (no specific CSS properties, no framework names,
      no language/runtime specifics) — the spec talks in terms of measurable
      properties (`height ≥ 44 CSS px`, `scrollWidth ≤ vw`, etc.) and freezes
      outcomes, not implementation.
- [x] Focused on user value and business needs — three user stories cover Owner
      acceptance, page-without-CTA handling, and reviewer auditability.
- [x] Written for non-technical stakeholders — success criteria use observable
      outcomes (panel reads PASS, zero console errors), not code constructs.
- [x] All mandatory sections completed — User Scenarios & Testing, Requirements,
      Success Criteria, Assumptions all present and non-empty.

## Requirement Completeness

- [x] No `[NEEDS CLARIFICATION]` markers remain — all six legacy clarification
      items have been resolved into declarative requirements or Assumptions (see
      "Resolutions" section at the bottom).
- [x] Requirements are testable and unambiguous — FR-001…FR-014 each name the
      exact property under test (height/width/scrollWidth/clipping/etc.).
- [x] Success criteria are measurable — SC-001…SC-007 each name the exact
      observable or diff artifact to inspect.
- [x] Success criteria are technology-agnostic — no React/Vue/Node mentions;
      references the "real Chrome 151" only via its role in the contract.
- [x] All acceptance scenarios are defined — three Given/When/Then blocks per
      P1 user story; reviewer-auditability user story includes three more.
- [x] Edge cases are identified — tabs/filters overflow, frozen `.btn-p` /
      `.btn-p.sm` visual, disabled/hidden elements, sandbox-can't-launch.
- [x] Scope is clearly bounded — explicit Out-of-Scope is implicit in FR-009…
      FR-012 (which forbid IA/routing/view-fn edits and new CTAs).
- [x] Dependencies and assumptions identified — Assumptions section names the
      real-Chrome-151 environment, the 17-page list, the mirror regeneration
      contract, and the visual-QA-CSS-only scope.

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria — every FR
      has at least one Given/When/Then scenario or a Success-Criterion mapping.
- [x] User scenarios cover primary flows — Owner-runs-harness, page-without-
      CTA, reviewer-audit each have P1 / P2 priorities.
- [x] Feature meets measurable outcomes defined in Success Criteria — SC-001…
      SC-007 are direct restatements of what the real run must produce.
- [x] No implementation details leak into specification — CSS-level edits are
      explicitly excluded (Assumptions: "Visual-QA fixes are constrained to
      the CSS region of `pasay-mini-app.html`. JavaScript edits are NOT in
      scope of this spec; if any JS edit proves necessary to satisfy FR-001 /
      FR-002 / FR-003, the spec returns BLOCKED.").

## Notes

- The previous draft `DESIGN-021-FIX3-SPEC.md` is treated as input only and
  is NOT canonical. Its C-1…C-5 items have been re-resolved here.
- Constitutional principles are referenced (`.specify/memory/constitution.md`
  v1.0.0). The spec defers Principle-IV disputes to `BLOCKED` rather than
  rubber-stamping a JS edit.

## Resolutions (legacy `DESIGN-021-FIX3-SPEC.md` clarification items)

| ID | Legacy question | Resolution in this spec |
|---|---|---|
| C-1 | Can the `__OD_RUN_BROWSER_QA` gate be edited to drop `primaryAction` from the `ok` formula? | Resolved by FR-005 (informational when absent) + FR-004 (full check when present). The gate edit is acceptable as long as it preserves the boolean for audit. The spec does NOT prescribe the edit; it prescribes the outcome. |
| C-2 | Should the spec dictate a specific CSS fix for the `.tabs` / `.filters` overflow? | Resolved: the spec freezes the result (FR-002 / FR-003), not the CSS line. The implementation may choose any path (container `min-width: 0`, padding redistribution, etc.) that achieves the result. |
| C-3 | Will increasing `.btn.sm` height break `appr-bar` visual rhythm? | Approved — legacy C-3 ratified. The spec ratifies it by FR-014 / Assumptions: any `.btn.sm` size change applies to non-primary variants only; `.btn-p` and `.btn-p.sm` are frozen. |
| C-4 | Should the mirror HTML be hand-synced or regenerator-driven? | Approved — legacy C-4 ratified. The spec ratifies it by FR-014 (mirror regeneration is mandatory). |
| C-5 | Is the sandbox-EPERM problem blocking? | Resolved as unblocked by constitution Principle VI — the final run is fixed at "real local Windows Chrome 151". A sandbox without that capability returns `BLOCKED`, not `FINAL PASS`. This is no longer a spec clarification; it is a constitutional rule. |
| — | `.btn-p` vs `.btn-p.sm` zero-visual-change contradiction | Resolved by Assumptions: `.btn-p` and `.btn-p.sm` are part of the frozen visual surface and are exempt from any "make `.btn.sm` ≥ 44px" rule. |
| — | "Interactive targets" must exclude disabled / hidden / decorative | Resolved by Key Entities definition of "Real interactive element" and Assumptions: `disabled`, `aria-hidden`, `display:none`, `visibility:hidden`, zero-`getBoundingClientRect` elements are NOT counted. |
