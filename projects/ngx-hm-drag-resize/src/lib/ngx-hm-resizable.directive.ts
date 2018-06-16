import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  OnDestroy,
  Output,
  Renderer2
} from '@angular/core';
import { Subscription } from 'rxjs';
import { addStyle, NgxHmDragResizeService } from './ngx-hm-drag-resize.service';

export const DefaultCornerButtonStyle = {
  borderColor: 'transparent #00FF00 #00FF00 transparent',
  borderStyle: 'solid solid solid solid',
  borderWidth: '10px',
  position: 'absolute',
  bottom: '0',
  right: '0',
  cursor: 'nwse-resize',
  visibility: 'hidden'
};

@Directive({
  selector: '[ngx-hm-resizable]'
})
export class NgxHmResizableDirective implements AfterViewInit, OnDestroy {
  @Output() resizeComplete = new EventEmitter();

  private sub$: Subscription;
  private hm: HammerManager;
  private btn: HTMLElement;
  private elm;

  @HostListener('mouseover')
  mouseover() {
    if (!this.btn) {
      return;
    }
    this.btn.style.visibility = 'visible';
  }

  @HostListener('mouseout')
  mouseout() {
    if (!this.btn) {
      return;
    }
    this.btn.style.visibility = 'hidden';
  }

  constructor(
    private eleRef: ElementRef,
    private renderer: Renderer2,
    private service: NgxHmDragResizeService
  ) {}

  ngAfterViewInit(): void {
    this.elm = this.eleRef.nativeElement;
    this.hm = new Hammer(this.btn);
    this.btn = this.createCornerBtn();
    this.sub$ = this.service
      .bindResize(this.renderer, this.elm, this.hm, this.resizeComplete)
      .subscribe();
  }

  private createCornerBtn() {
    const btn = this.renderer.createElement('div') as HTMLElement;
    addStyle(this.renderer, btn, DefaultCornerButtonStyle);
    this.renderer.appendChild(this.elm, btn);
    return btn;
  }

  ngOnDestroy(): void {
    this.hm.destroy();
    this.sub$.unsubscribe();
  }
}
