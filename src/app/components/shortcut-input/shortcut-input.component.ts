import {
  AfterViewInit, booleanAttribute,
  Component, DestroyRef,
  ElementRef,
  forwardRef, inject,
  Input,
  ViewChild
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {filter, fromEvent} from 'rxjs';

@Component({
  selector: 'shortcut-input',
  templateUrl: './shortcut-input.component.html',
  styleUrls: ['./shortcut-input.component.css'],
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ShortcutInputComponent),
      multi: true
    }
  ]
})
export class ShortcutInputComponent implements ControlValueAccessor, AfterViewInit {
  @ViewChild('inputEl') inputEl!: ElementRef;
  @Input({transform: booleanAttribute}) checkToModifier: boolean = true;
  public shortcut: string = '';
  private modifiers: string[] = ['Control', 'Alt', 'Shift', 'CapsLock', 'Meta'];
  private pressedKeys: Set<string> = new Set();
  private destroyRef: DestroyRef = inject(DestroyRef)
  private lastValidShortcut: string = '';

  onChange!: (value: any) => void;
  onTouched!: () => void;

  constructor() {
  }

  ngAfterViewInit(): void {
    this.setupKeyListeners();
  }

  writeValue(value: string): void {
    this.shortcut = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  private setupKeyListeners(): void {
    fromEvent<KeyboardEvent>(this.inputEl.nativeElement, 'keydown')
      .pipe(
        filter((event: KeyboardEvent) => !event.repeat),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event: KeyboardEvent) => {
        event.preventDefault();
        this.pressedKeys.add(event.key);

        if (this.checkToModifier) {
          this.updateShortcut();
        } else {
          this.shortcut = `${this.shortcut}${event.key} `
        }
      });

    fromEvent<KeyboardEvent>(this.inputEl.nativeElement, 'keyup')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event: KeyboardEvent) => {
        this.pressedKeys.delete(event.key);

        if (!this.pressedKeys.size && !this.isValidShortcut() && this.checkToModifier) {
          this.shortcut = this.lastValidShortcut || '';
        }
      });
  }

  private updateShortcut(): void {
    if (!this.checkToModifier) {
      this.shortcut = `${this.shortcut}${Array.from(this.pressedKeys).at(-1)} `
      return;
    }

    if (!this.hasModifier()) {
      this.shortcut = this.lastValidShortcut || '';
      return;
    }

    const {modifiers, otherKey} = this.getModifierAndOtherKeys(Array.from(this.pressedKeys));
    const shortcut: string = [...modifiers, otherKey].join(' ');

    if (this.isValidShortcut(shortcut)) {
      this.shortcut = shortcut;
      this.lastValidShortcut = this.shortcut;
      this.pressedKeys.clear();
      this.onChange(this.shortcut);
    } else if (!this.lastValidShortcut) {
      this.shortcut = shortcut;
    }
  }

  private hasModifier(): boolean {
    return Array.from(this.pressedKeys)
      .some((key: string) => this.modifiers.includes(key));
  }

  private isValidShortcut(value = this.shortcut): boolean {
    const shortcut: string[] = value.trim().split(' ');
    const {modifiers, otherKey} = this.getModifierAndOtherKeys(shortcut);

    return !!(otherKey && modifiers.length);
  }

  private getModifierAndOtherKeys(pressedKeys: string[]) {
    const modifiers: string[] = [];
    let otherKey: string = '';

    pressedKeys.forEach((key: string) => {
      if (this.modifiers.includes(key)) {
        modifiers.push(key);
      } else {
        otherKey = key;
      }
    });

    return {
      modifiers,
      otherKey
    }
  }
}
