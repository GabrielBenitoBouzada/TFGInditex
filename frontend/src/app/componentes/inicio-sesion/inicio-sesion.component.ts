import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AuthService, LoginResponse } from '../../servicios/autenticacion.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IdiomaService } from '../../servicios/idioma.service';

@Component({
  selector: 'app-inicio-sesion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    TranslateModule
  ],
  templateUrl: './inicio-sesion.component.html',
  styleUrls: ['./inicio-sesion.component.css']
})
export class InicioSesionComponent {
  formulario: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private translate: TranslateService,
    private idiomaService: IdiomaService
  ) {
    this.formulario = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  login(): void {
    if (this.formulario.invalid) {
      return;
    }

    const { email, password } = this.formulario.value;
    this.authService.login(email, password).subscribe({
      next: (res: LoginResponse) => {
        const idioma = res.idioma || res.idiomaPredeterminado || 'es';

        const usuario = {
          email: res.email,
          nombre: res.nombre,
          rol: res.rol,
          subrol: res.subrol,
          idioma: idioma,
          preferenciasAccesibilidad: res.preferenciasAccesibilidad || {}
        };

        localStorage.setItem('usuario', JSON.stringify(usuario));
        localStorage.setItem('idioma', idioma);

        this.translate.use(idioma);
        this.idiomaService.setIdioma(idioma);

        this.router.navigate(['/home']);
      },
      error: () => {
        alert(this.translate.instant('LOGIN.ERROR_CREDENTIALS'));
      }
    });
  }
}
