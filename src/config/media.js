/* Where the sign-in stage gets its figure.

   `WALK_VIDEO` is the one switch. Set it and the stage plays that clip with
   `WALK_POSTER` as its first frame; leave it null and the stage draws its own
   SVG clinician instead.

   These two are the only remote assets in the product. Everything else —
   fonts, icons, illustrations — is in the bundle, because a clinic with bad
   internet should still get a working sign-in screen. The stage falls back to
   the SVG on its own if the host is unreachable, so a dead link costs a look,
   not a login. */
export const WALK_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_3HqlRuHKIxr0vA4RiLnD6KnYOZq/hf_20260921_155112_64733b95-563b-41c8-95c5-0f1f49e4385b.mp4';
export const WALK_POSTER =
  'https://d2ol7oe51mr4n9.cloudfront.net/user_3HqlRuHKIxr0vA4RiLnD6KnYOZq/e476d95a-037a-4f27-8a82-06a8fe4c46d5.png';
