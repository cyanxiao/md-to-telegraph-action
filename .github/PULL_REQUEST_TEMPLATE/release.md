## Release Checklist

### Pre-Release Validation

- [ ] All tests pass locally (`yarn test`)
- [ ] Linting passes (`yarn lint`)
- [ ] Build completes successfully (`yarn build`)
- [ ] Package builds correctly (`yarn package`)
- [ ] No uncommitted changes in `dist/` folder after packaging

### Documentation & Versioning

- [ ] Version bumped in `package.json`
- [ ] `CHANGELOG.md` updated with new changes
- [ ] README.md updated if new features added
- [ ] Action documentation updated if inputs/outputs changed

### Testing

- [ ] Integration tests pass
- [ ] Action works with example workflows
- [ ] No breaking changes (or documented if necessary)

### Release Notes

- [ ] Clear description of changes
- [ ] Breaking changes highlighted
- [ ] Migration guide provided (if needed)

### Post-Release

- [ ] Example workflows updated to use new version
- [ ] Major version tag will be updated automatically
- [ ] Release branch will be updated automatically

## Changes in this Release

<!-- Describe the main changes, new features, bug fixes, etc. -->

## Breaking Changes

<!-- List any breaking changes and migration instructions -->

## Additional Notes

<!-- Any additional context or notes for reviewers -->
