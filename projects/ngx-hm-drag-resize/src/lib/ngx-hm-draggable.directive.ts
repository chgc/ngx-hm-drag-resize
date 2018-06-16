import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  Renderer2
} from '@angular/core';
import { Subscription } from 'rxjs';
import { NgxHmDragResizeService } from './ngx-hm-drag-resize.service';

@Directive({
  selector: '[ngx-hm-draggable]'
})
export class NgxHmDraggableDirective implements AfterViewInit, OnDestroy {
  @Input('hm-draggable-container') container: HTMLElement;
  @Output() dragComplete = new EventEmitter();

  private sub$: Subscription;

  private hm: HammerManager;
  private elm: HTMLElement;

  @HostListener('mouseover')
  mouseover() {
    if (!this.elm) {
      return;
    }
    this.elm.style.backgroundColor = '#fcfda9';
  }

  @HostListener('mouseout')
  mouseout() {
    if (!this.elm) {
      return;
    }
    this.elm.style.backgroundColor = '';
  }

  constructor(
    private _elm: ElementRef,
    private _renderer: Renderer2,
    private _service: NgxHmDragResizeService
  ) {}

  ngAfterViewInit(): void {
    this.elm = this._elm.nativeElement as HTMLElement;
    this.hm = new Hammer(this.elm);
    this.sub$ = this._service
      .bindDrag(
        this._renderer,
        this.elm,
        this.hm,
        this.container,
        this.dragComplete
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.hm.destroy();
    this.sub$.unsubscribe();
  }
}
