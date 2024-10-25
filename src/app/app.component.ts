import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {FormsModule} from '@angular/forms';
import {ShortcutInputComponent} from './components/shortcut-input/shortcut-input.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ShortcutInputComponent, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  shortcutValue: string = '';

  public updatedShortcut(ev: string) {
    console.log(ev)
  }
}
