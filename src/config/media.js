/* Where the sign-in stage gets its figure.

   `WALK_VIDEO` is the one switch. Set it and the stage plays that clip with
   `WALK_POSTER` as its first frame; leave it null and the stage draws its own
   SVG clinician instead.

   These two are the only remote assets in the product. Everything else —
   fonts, icons, illustrations — is in the bundle, because a clinic with bad
   internet should still get a working sign-in screen. The stage falls back to
   the SVG on its own if the host is unreachable, so a dead link costs a look,
   not a login. */
export const WALK_VIDEO = '/walking.mp4';
export const WALK_POSTER = null;
