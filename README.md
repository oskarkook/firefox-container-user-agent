# Firefox Container User-Agent

Rewrites the `User-Agent` request header, only in the
[containers](https://support.mozilla.org/kb/containers) you choose.

Click the toolbar icon to turn it on or off for the current tab's container.

## Releasing

1. Bump `version` in `manifest.json` and commit it.
2. Tag the commit with the same version prefixed with `v`, and push it:

   ```sh
   git tag v1.2.3
   git push origin master v1.2.3
   ```

The [release workflow](.github/workflows/release.yml) then lints the extension,
signs it on AMO as unlisted, and creates a GitHub release with the signed
`.xpi` attached. It fails if the tag doesn't match the `manifest.json` version.
Signing needs the `AMO_JWT_ISSUER` and `AMO_JWT_SECRET` repository secrets.
