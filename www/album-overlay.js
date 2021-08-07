import Util from './util.js';
import ViewUtil from './view-util.js';

/**
 *
 */
class AlbumOverlay {

  /** Overlay is above almost all other elements on the page */
  $overlayScreen = $('#fullOverlayScreen');
  /** The album image copy, which is actually one level above in the z-index. */
  $overlayImage = $('#fullOverlayImage');
  $sourceImage;

  constructor() {
    Util.addAppListener(this, 'album-picture-click', this.onAlbumPictureClick);
    this.$overlayScreen.on('click tap', () => this.animateOut());
    this.$overlayImage.on('click tap', () => this.animateOut());
  }

  noop() {}

  onAlbumPictureClick($sourceImage) {
    this.$sourceImage = $($sourceImage); // todo weird, revisit
    this.animateIn();
  }

  animateIn() {
    ViewUtil.setDisplayed(this.$overlayScreen, true);
    ViewUtil.setDisplayed(this.$overlayImage, true);
    ViewUtil.setVisible(this.$sourceImage, false);

    // Set overlay image to use same src as the source image.
    this.$overlayImage.attr('src', this.$sourceImage.attr('src'));

    // Overlay height must be set programmatically
    const h = $('#page').height() - $('#playbarView').height();
    this.$overlayScreen.css('height', h);

    const startRect = this.getConvertedStartRect(this.$sourceImage);
    ViewUtil.setCssSync(this.$overlayImage,
        () => ViewUtil.setXYWH(this.$overlayImage, ...startRect));

    const endRect = this.getEndRect(this.$sourceImage);
    ViewUtil.setXYWH(this.$overlayImage, ...endRect);

    ViewUtil.setCssSync(this.$overlayScreen, () => this.$overlayScreen.css('opacity', 0));
    this.$overlayScreen.css('opacity', 1);

    $(document).on('debounced-window-resize', this.onWindowResize);
  }

  animateOut() {
    const r = this.getConvertedStartRect(this.$sourceImage);
    ViewUtil.setXYWH(this.$overlayImage, ...r);

    ViewUtil.animateCss(this.$overlayScreen,
        () => this.$overlayScreen.css('opacity', 1),
        () => this.$overlayScreen.css('opacity', 0),
        () => this.hide());
  }

  /**
   * Get source image's (real content) rect in overlay's coordinate space.
   * Overlay image will be played on top for some swap action.
   */
  getConvertedStartRect($sourceImage) {
    const srcRect = $sourceImage[0].getBoundingClientRect();
    const overlayRect = this.$overlayScreen[0].getBoundingClientRect();
    let newX = srcRect.x - overlayRect.x;
    let newY = srcRect.y - overlayRect.y;
    let newW = srcRect.width;
    let newH = srcRect.height;

    // Source <img> is object-fit contain, so need to adjust for that.
    const natchW = $sourceImage[0].naturalWidth;
    const natchH = $sourceImage[0].naturalHeight;
    const r = ViewUtil.fitInRect(natchW, natchH, newW, newH);
    newX += r.x;
    newW -= r.x * 2;
    newY += r.y;
    newH -= r.y * 2; // todo huh?
    return [newX, newY, newW, newH];
  }

  getEndRect($sourceImage) {
    const r = ViewUtil.fitInRect(
        $sourceImage[0].naturalWidth, $sourceImage[0].naturalHeight,
        this.$overlayScreen.width(), this.$overlayScreen.height());
    return [r.x, r.y, r.w, r.h];
  }

  hide() {
    ViewUtil.setDisplayed(this.$overlayScreen, false);
    ViewUtil.setDisplayed(this.$overlayImage, false);
    this.$sourceImage.css('visibility', ''); // nb! (?!)
    $(document).on('debounced-window-resize', this.onWindowResize);
  }

  onWindowResize = () => {
    // Overlay height must be set programmatically
    const h = $('#page').height() - $('#playbarView').height();
    this.$overlayScreen.css('height', h);

    const r = this.getEndRect(this.$sourceImage);
    ViewUtil.setCssSync(this.$overlayImage,
        () => ViewUtil.setXYWH(this.$overlayImage, ...r));
  };
}

export default new AlbumOverlay();