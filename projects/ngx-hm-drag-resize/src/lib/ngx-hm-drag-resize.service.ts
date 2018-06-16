import { EventEmitter, Injectable, Renderer2 } from '@angular/core';
import { fromEvent, Observable, Subject, empty, BehaviorSubject } from 'rxjs';
import { finalize, switchMap, takeUntil, tap, map } from 'rxjs/operators';

// tslint:disable-next-line:import-blacklist

/**
 * Example
<div #continer style="width: 500px; height:500px; position: absolute; left:50px; top:50px; border:1px solid white">

  <div style="position: relative;">

      <div hm-draggable [hm-draggable-container]="continer"
           hm-resize style="width:200px;height:200px;background:chocolate">
          sdadasd
        </div>
  </div>

</div>
 */

export interface StartPoint {
  left: number;
  top: number;
  width: number;
  height: number;
}

@Injectable({
  providedIn: 'root'
})
export class NgxHmDragResizeService {
  private resize$ = new Subject();
  private initGoPoint = {
    left: 0,
    top: 0,
    width: 0,
    height: 0
  };

  bindDrag(
    _renderer: Renderer2,
    elm: HTMLElement,
    hm: HammerManager,
    container: HTMLElement,
    dragComplete$: EventEmitter<any>
  ): Observable<any> {
    if (!container) {
      return empty();
    }
    hm.get('pan').set({ direction: Hammer.DIRECTION_ALL });

    const goPoint$ = new BehaviorSubject(this.initGoPoint);
    const containerZero = container.getBoundingClientRect();

    goPoint$.subscribe(({ left, top }) => {
      addStyle(_renderer, elm, {
        left: `${left}px`,
        top: `${top}px`
      });
    });

    const setCursorStyle = start => {
      if (start) {
        _renderer.setStyle(elm, 'cursor', '-webkit-grabbing');
        _renderer.setStyle(elm, 'cursor', 'grabbing');
      } else {
        _renderer.setStyle(elm, 'cursor', '-webkit-grab');
        _renderer.setStyle(elm, 'cursor', 'grab');
      }
    };

    const getGoPoint = (startPoint, e) => ({
      left: startPoint.left + e.deltaX,
      top: startPoint.top + e.deltaY,
      width: e.target.offsetWidth,
      height: e.target.offsetHeight
    });

    const panEnd$ = fromEvent(hm, 'panend');
    const panStart$ = fromEvent(hm, 'panstart').pipe(
      tap(() => setCursorStyle(true)),
      map(() => ({
        left: parseFloat(elm.style.left) || 0,
        top: parseFloat(elm.style.top) || 0
      }))
    );

    const withGoPoint = startPoint => obs =>
      obs.pipe(
        map(e => getGoPoint(startPoint, e)),
        map((goPoint: StartPoint) => this.getMovePoint(goPoint, containerZero)),
        tap((goPoint: StartPoint) => goPoint$.next(goPoint))
      );

    const dragComplete = () => {
      dragComplete$.emit({
        left: goPoint$.getValue().left,
        top: goPoint$.getValue().top
      });
      setCursorStyle(false);
    };

    const whenMoveActionStop = obs =>
      obs.pipe(
        takeUntil(panEnd$),
        takeUntil(this.resize$),
        finalize(dragComplete)
      );

    const setPanMoveAction = startPoint =>
      fromEvent(hm, 'panmove').pipe(
        withGoPoint(startPoint),
        whenMoveActionStop
      );

    return panStart$.pipe(
      switchMap(startPoint => setPanMoveAction(startPoint))
    );
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

  private getDistance({ x, y }) {
    return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
  }

  bindResize(
    _renderer: Renderer2,
    container: HTMLElement,
    hm: HammerManager,
    resizeComplete$: EventEmitter<any>
  ): Observable<any> {
    hm.get('pan').set({ direction: Hammer.DIRECTION_ALL });

    const panStart$ = fromEvent(hm, 'panstart');
    const panMove$: Observable<HammerInput> = fromEvent(hm, 'panmove');
    const panEnd$ = fromEvent(hm, 'panend');

    const addContainerStyle = (pmEvent: HammerInput, boundingClientRect) => {
      addStyle(_renderer, container, {
        height: `${pmEvent.center.y - boundingClientRect.top}px`,
        width: `${pmEvent.center.x - boundingClientRect.left}px`
      });
    };

    const emitResizeComplete = () => {
      resizeComplete$.emit({
        height: container.clientHeight,
        width: container.clientWidth
      });
    };

    const panMoveHanlder = boundingClientRect =>
      panMove$.pipe(
        tap(pmEvent => addContainerStyle(pmEvent, boundingClientRect)),
        takeUntil(panEnd$),
        finalize(emitResizeComplete)
      );

    return panStart$.pipe(
      map(() => container.getBoundingClientRect()),
      tap(() => this.resize$.next()),
      switchMap(panMoveHanlder)
    );
  }
}

export function addStyle(
  _renderer: Renderer2,
  elm: HTMLElement,
  style: { [key: string]: string | number } = {}
) {
  Object.entries(style).forEach(([key, value]) => {
    _renderer.setStyle(elm, key, value);
  });
}
