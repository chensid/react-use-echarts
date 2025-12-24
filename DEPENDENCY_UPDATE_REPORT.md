# Dependency Update Report

**Report Date:** 2025-12-24  
**Project:** react-use-echarts v1.0.2  
**Package Manager:** pnpm v10.26.2

> **Note:** When performing future dependency checks, update the "Report Date" above to the current date and regenerate this report using `pnpm outdated` and `pnpm update --latest --interactive`.

## Executive Summary

✅ **All dependencies are up-to-date!**

All devDependencies are currently using the latest available versions within their specified semver ranges. No updates are required at this time.

## Dependency Status

### Current Dependencies (package.json)

#### devDependencies

| Package | Current Version | Status |
|---------|----------------|--------|
| @eslint/js | ^9.39.2 | ✅ Latest |
| @testing-library/react | ^16.3.1 | ✅ Latest |
| @types/node | ^25.0.3 | ✅ Latest |
| @types/react | ^19.2.7 | ✅ Latest |
| @types/react-dom | ^19.2.3 | ✅ Latest |
| @vitejs/plugin-react | ^5.1.2 | ✅ Latest |
| @vitest/coverage-v8 | ^4.0.16 | ✅ Latest |
| babel-plugin-react-compiler | ^1.0.0 | ✅ Latest |
| baseline-browser-mapping | ^2.9.11 | ✅ Latest |
| echarts | ^6.0.0 | ✅ Latest |
| eslint | ^9.39.2 | ✅ Latest |
| eslint-plugin-react-hooks | ^7.0.1 | ✅ Latest |
| eslint-plugin-react-refresh | ^0.4.26 | ✅ Latest |
| globals | ^16.5.0 | ✅ Latest |
| jsdom | ^27.3.0 | ✅ Latest |
| react | ^19.2.3 | ✅ Latest |
| react-dom | ^19.2.3 | ✅ Latest |
| typescript | ~5.9.3 | ✅ Latest (minor version locked) |
| typescript-eslint | ^8.50.1 | ✅ Latest |
| vite | npm:rolldown-vite@7.3.0 | ✅ Latest |
| vite-plugin-dts | ^4.5.4 | ✅ Latest |
| vitest | ^4.0.16 | ✅ Latest |

#### peerDependencies

| Package | Required Version | Status |
|---------|-----------------|--------|
| echarts | ^6.0.0 | ✅ Latest major version |
| react | ^19.2.0 | ✅ Latest major version |
| react-dom | ^19.2.0 | ✅ Latest major version |

## Verification

### Build Status
✅ TypeScript compilation successful
```bash
pnpm typecheck
```

### Lint Status
✅ No linting errors
```bash
pnpm lint
```

### Test Status
✅ All 85 tests passing across 6 test files
```bash
pnpm test
```
- src/__tests__/utils/connect.test.ts (19 tests)
- src/__tests__/hooks/use-lazy-init.test.ts (10 tests)
- src/__tests__/hooks/use-echarts.test.ts (32 tests)
- src/__tests__/utils/instance-cache.test.ts (11 tests)
- src/__tests__/themes/index.test.ts (12 tests)
- src/__tests__/hooks/theme-change.test.ts (1 test)

## Recommendations

### Short Term (Next 30 Days)
- Continue monitoring for security updates
- Review changelog for minor/patch updates as they become available

### Medium Term (Next 90 Days)
- Monitor for React 19.x updates and ecosystem compatibility
- Watch for ECharts 6.x updates
- Keep an eye on TypeScript 5.10+ when released

### Best Practices
1. **Monitor for updates:** Check `pnpm outdated` weekly for security patches and critical updates
2. **Comprehensive reviews:** Perform full dependency reviews (like this report) every 30 days
3. **Review changelogs:** Always check changelogs before updating major/minor versions
4. **Test thoroughly:** Run full test suite after each update
5. **Batch updates:** Update dependencies in small batches to isolate issues
6. **Align versions:** Keep peerDependencies versions aligned with devDependencies for testing

## Special Notes

### Vite Override
The project uses `rolldown-vite@7.3.0` as an override for the standard vite package:
```json
"vite": "npm:rolldown-vite@7.3.0"
```

**Rationale:** [Rolldown](https://rolldown.rs/) is a high-performance bundler written in Rust that aims to be compatible with Rollup's API while offering significantly better performance. The project uses it as a drop-in replacement for Vite's default bundler (Rollup) to achieve faster build times.

**Considerations for updates:**
- Verify rolldown-vite package is still actively maintained
- Check compatibility with other Vite plugins when updating
- Monitor for when Rolldown becomes the default in official Vite (planned for future versions)

### TypeScript Version Constraint
TypeScript is pinned to `~5.9.3` (tilde constraint - patch-level updates only):

**Rationale:** The tilde (`~`) constraint limits updates to patch versions only (5.9.x), preventing automatic minor version updates. This is a conservative approach that:
- Ensures build stability and reproducibility
- Prevents unexpected breaking changes in TypeScript compiler behavior
- Aligns with the project's stability-focused approach

**Considerations:**
- Manually review TypeScript 5.10+ release notes when available
- Update the version constraint when ready to adopt new TypeScript features
- Security and critical bug fixes in patch versions (5.9.4, 5.9.5, etc.) will still be applied automatically

## Next Dependency Check

**Recommended Next Check:** 30 days from report date

To perform the next dependency check:
1. Run `pnpm outdated` to check for updates
2. Run `pnpm update --latest --interactive` to review and apply updates
3. Verify with `pnpm typecheck && pnpm lint && pnpm test`
4. Update the "Report Date" at the top of this file
5. Update the table and verification results as needed

---

**Report Generated By:** Automated Dependency Check  
**Command Used:** `pnpm outdated` and `pnpm update --latest --interactive`
