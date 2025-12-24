# Dependency Update Report

**Report Date:** 2025-12-24  
**Project:** react-use-echarts v1.0.2  
**Package Manager:** pnpm v10.26.2

> **Note:** When performing future dependency checks, update the "Report Date" above and refresh the following sections:
> - Dependency status table (current versions)
> - Verification results (build, test, lint output)
> - Medium-term recommendations (based on ecosystem changes)

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

#### Monitoring Schedule
1. **Weekly monitoring (5 minutes):** 
   - Run `pnpm outdated` to check for available updates
   - If security patches are available, apply them immediately
   - If minor/patch updates are available, review changelogs and schedule for next monthly review
   
2. **Monthly comprehensive review (30 minutes):**
   - Perform full dependency audit like this report
   - Apply non-security updates in batches
   - Run full test suite after updates
   - Update this report with new findings

#### Update Guidelines
3. **Review changelogs:** Always check changelogs before updating major/minor versions
4. **Test thoroughly:** Run `pnpm typecheck && pnpm lint && pnpm test` after each update
5. **Batch updates:** Update dependencies in small batches to isolate issues
6. **Align versions:** Keep peerDependencies versions aligned with devDependencies for testing

## Special Notes

### Vite Override
The project uses `rolldown-vite@7.3.0` as an override for the standard vite package:
```json
"vite": "npm:rolldown-vite@7.3.0"
```

**Rationale:** The project uses `rolldown-vite`, which integrates [Rolldown](https://rolldown.rs/) - a Rust-based bundler designed for high performance and Rollup API compatibility - as an alternative to Vite's standard production bundler.

**Considerations for updates:**
- Verify rolldown-vite package is actively maintained before updating
- Test compatibility with all Vite plugins after updates
- Check rolldown-vite changelog for breaking changes
- Monitor the broader Vite/Rolldown ecosystem for compatibility updates

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

**Recommended Schedule:** Follow the monitoring schedule above (weekly checks + monthly comprehensive reviews)

### Steps for Next Comprehensive Review
1. Run `pnpm outdated` to check for updates
2. Run `pnpm update --latest --interactive` to review and apply updates
3. Verify with `pnpm typecheck && pnpm lint && pnpm test`
4. Update this report:
   - Update "Report Date" at the top
   - Refresh dependency table with new versions
   - Update verification results
   - Adjust recommendations based on ecosystem changes

---

**Report Generated By:** Automated Dependency Check  
**Command Used:** `pnpm outdated` and `pnpm update --latest --interactive`
