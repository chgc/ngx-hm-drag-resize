import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  OnDestroy,
  Output,
  Renderer2,
  HostBinding
} from '@angular/core';
import { Subscription, Observable, fromEvent, Subject } from 'rxjs';
import { NgxHmDragResizeService } from './ngx-hm-drag-resize.service';
import { tap, takeUntil, finalize, switchMap, map } from 'rxjs/operators';

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
  private destory$ = new Subject<boolean>();

  @HostBinding('style.height.px') elmHight;
  @HostBinding('style.width.px') elmWidth;

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
    this.btn = this.createCornerBtn();
    this.hm = new Hammer(this.btn);
    this.bindResize()
      .pipe(takeUntil(this.destory$))
      .subscribe();
  }

  private bindResize(): Observable<any> {
    this.hm.get('pan').set({ direction: Hammer.DIRECTION_ALL });
    const panStart$ = fromEvent(this.hm, 'panstart');
    const panMove$: Observable<HammerInput> = fromEvent(this.hm, 'panmove');
    const panEnd$ = fromEvent(this.hm, 'panend');

    const addContainerStyle = (pmEvent: HammerInput, boundingClientRect) => {
      this.elmHight = pmEvent.center.y - boundingClientRect.top;
      this.elmWidth = pmEvent.center.x - boundingClientRect.left;
    };

    const emitResizeComplete = () => {
      this.resizeComplete.emit({
        height: this.elm.clientHeight,
        width: this.elm.clientWidth
      });
    };

    const panMoveHanlder = boundingClientRect =>
      panMove$.pipe(
        tap(pmEvent => addContainerStyle(pmEvent, boundingClientRect)),
        takeUntil(panEnd$),
        finalize(emitResizeComplete)
      );

    return panStart$.pipe(
      map(() => this.elm.getBoundingClientRect()),
      tap(() => this.service.resize$.next()),
      switchMap(panMoveHanlder)
    );
  }

  private createCornerBtn() {
    const btn = this.renderer.createElement('div') as HTMLElement;
    this.service.addStyle(this.renderer, btn, DefaultCornerButtonStyle);
    this.renderer.appendChild(this.elm, btn);
    return btn;
  }

  ngOnDestroy(): void {
    this.hm.destroy();
    this.destory$.next(true);
  }
}
