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

@Directive({
  selector: '[ngx-hm-resizable]'
})
export class NgxHmResizableDirective implements AfterViewInit, OnDestroy {
  @Output() risizeComplete = new EventEmitter();

  private sub$: Subscription;
  private hm: HammerManager;
  private btn: HTMLElement;

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
    private _elm: ElementRef,
    private _renderer: Renderer2,
    private _service: NgxHmDragResizeService
  ) {}

  ngAfterViewInit(): void {
    this.createCornerBtn();
    this.hm = new Hammer(this.btn);
    this.sub$ = this._service
      .bindResize(
        this._renderer,
        this._elm.nativeElement,
        this.hm,
        this.risizeComplete
      )
      .subscribe();
  }

  private createCornerBtn() {
    this.btn = this._renderer.createElement('div') as HTMLElement;

    addStyle(this._renderer, this.btn, {
      borderColor: 'transparent #00FF00 #00FF00 transparent',
      borderStyle: 'solid solid solid solid',
      borderWidth: '10px',
      position: 'absolute',
      bottom: '0',
      right: '0',
      cursor: 'nwse-resize',
      visibility: 'hidden'
    });

    this._renderer.appendChild(this._elm.nativeElement, this.btn);
  }

  ngOnDestroy(): void {
    this.hm.destroy();
    this.sub$.unsubscribe();
  }
}
