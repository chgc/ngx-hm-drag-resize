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
import {
  Subscription,
  fromEvent,
  Observable,
  BehaviorSubject,
  empty
} from 'rxjs';
import { NgxHmDragResizeService } from './ngx-hm-drag-resize.service';
import { tap, map, takeUntil, finalize, switchMap } from 'rxjs/operators';

export interface StartPoint {
  left: number;
  top: number;
  width: number;
  height: number;
}

@Directive({
  selector: '[ngx-hm-draggable]'
})
export class NgxHmDraggableDirective implements AfterViewInit, OnDestroy {
  @Input('hm-draggable-container') container: HTMLElement;
  @Output() dragComplete = new EventEmitter();

  private sub$: Subscription;

  private hm: HammerManager;
  private elm: HTMLElement;

  private initGoPoint = {
    left: 0,
    top: 0,
    width: 0,
    height: 0
  };

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
    this.sub$ = this.bindDrag().subscribe();
  }

  bindDrag(): // _renderer: Renderer2,
  // elm: HTMLElement,
  // hm: HammerManager,
  // container: HTMLElement,
  // dragComplete$: EventEmitter<any>
  Observable<any> {
    if (!this.container) {
      return empty();
    }
    this.hm.get('pan').set({ direction: Hammer.DIRECTION_ALL });

    const goPoint$ = new BehaviorSubject(this.initGoPoint);
    const containerZero = this.container.getBoundingClientRect();

    goPoint$.subscribe(({ left, top }) => {
      this._service.addStyle(this._renderer, this.elm, {
        left: `${left}px`,
        top: `${top}px`
      });
    });

    const setCursorStyle = start => {
      if (start) {
        this._renderer.setStyle(this.elm, 'cursor', '-webkit-grabbing');
        this._renderer.setStyle(this.elm, 'cursor', 'grabbing');
      } else {
        this._renderer.setStyle(this.elm, 'cursor', '-webkit-grab');
        this._renderer.setStyle(this.elm, 'cursor', 'grab');
      }
    };

    const getGoPoint = (startPoint, e) => ({
      left: startPoint.left + e.deltaX,
      top: startPoint.top + e.deltaY,
      width: e.target.offsetWidth,
      height: e.target.offsetHeight
    });

    const panEnd$ = fromEvent(this.hm, 'panend');
    const panStart$ = fromEvent(this.hm, 'panstart').pipe(
      tap(() => setCursorStyle(true)),
      map(() => ({
        left: parseFloat(this.elm.style.left) || 0,
        top: parseFloat(this.elm.style.top) || 0
      }))
    );

    const withGoPoint = startPoint => obs =>
      obs.pipe(
        map(e => getGoPoint(startPoint, e)),
        map((goPoint: StartPoint) => this.getMovePoint(goPoint, containerZero)),
        tap((goPoint: StartPoint) => goPoint$.next(goPoint))
      );

    const dragComplete = () => {
      this.dragComplete.emit({
        left: goPoint$.getValue().left,
        top: goPoint$.getValue().top
      });
      setCursorStyle(false);
    };

    const whenMoveActionStop = obs =>
      obs.pipe(
        takeUntil(panEnd$),
        takeUntil(this._service.resize$),
        finalize(dragComplete)
      );

    const setPanMoveAction = startPoint =>
      fromEvent(this.hm, 'panmove').pipe(
        withGoPoint(startPoint),
        whenMoveActionStop
      );

    return panStart$.pipe(
      switchMap(startPoint => setPanMoveAction(startPoint))
    );
  }

  ngOnDestroy(): void {
    this.hm.destroy();
    this.sub$.unsubscribe();
  }

  private getMovePoint(
    startPoint: StartPoint,
    containerZero: ClientRect | DOMRect
  ) {
    const getRightBottom = (_startPoint, _containerZero) => {
      const result = {
        rightPosition: _startPoint.left + _startPoint.width,
        bottomPosition: _startPoint.top + _startPoint.height,
        isOverContainerWidth: false,
        isOverContainerHeight: false
      };
      result.isOverContainerWidth = result.rightPosition > _containerZero.width;
      result.isOverContainerHeight =
        result.bottomPosition > _containerZero.height;

      return result;
    };

    const elmRightBottom = getRightBottom(startPoint, containerZero);

    if (startPoint.left < 0) {
      startPoint.left = 0;
    } else if (elmRightBottom.isOverContainerWidth) {
      startPoint.left = containerZero.width - startPoint.width;
    }

    if (startPoint.top < 0) {
      startPoint.top = 0;
    } else if (elmRightBottom.isOverContainerHeight) {
      startPoint.top = containerZero.height - startPoint.height;
    }
    return startPoint;
  }
}
