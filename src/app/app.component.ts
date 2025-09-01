import { Component, Inject, ViewChild, AfterViewInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { MatSelectModule } from '@angular/material/select';

interface User {
  id: number;
  name: string;
  isComplete: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    HttpClientModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements AfterViewInit {
  title = 'UserFront';
  displayedColumns: string[] = ['id', 'name', 'email', 'password', 'username', 'isComplete', 'actions'];
  dataSource = new MatTableDataSource<User>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  private apiUrl = 'http://localhost:8080/api/todo';
  accessToken: any;
  constructor(private dialog: MatDialog, private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) { }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      // Iniciar el proceso de autenticación y carga de usuarios.
      this.loginAndLoadUsers();
    }
  }

  private getAuthHeaders(): HttpHeaders {
    if (isPlatformBrowser(this.platformId)) {
      const token = this.accessToken;// localStorage.getItem('authToken');
      return new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });
    }
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  loginAndLoadUsers() {
    // Definir las credenciales para Basic Auth
    const usernameAngularApp = 'angularapp';
    const passwordAngularApp = '12345';
    const basicAuthString = btoa(`${usernameAngularApp}:${passwordAngularApp}`);

    // Crear las cabeceras con la autenticación Basic Auth, tal como en el código C#
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Basic ${basicAuthString}`
    });

    // Definir los datos de login para el usuario "admin"
    const loginData = { username: "admin", password: "admin" };

    // Realizar la petición POST con ambas credenciales en un solo paso
    this.http.post<any>('http://localhost:8080/api/auth/signin', loginData, { headers }).subscribe(
      response => {
        if (isPlatformBrowser(this.platformId)) {
          // Guardar el token de acceso final
          this.accessToken = response.token.replace('Bearer ', '');
          localStorage.setItem('authToken', this.accessToken);
          console.log('Login exitoso. Token guardado.');
        }
        // Cargar los usuarios con el token recién obtenido
        this.loadUsers();
      },
      error => {
        console.error('Error en el proceso de autenticación o carga de usuarios:', error);
      }
    );
  }

  loadUsers() {
    this.http.get<User[]>(this.apiUrl, { headers: this.getAuthHeaders() }).subscribe(data => {
      this.dataSource.data = data;
      if (isPlatformBrowser(this.platformId)) {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      }
    });
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  createUser(user: User) {
    this.http.post<User>(this.apiUrl, user, { headers: this.getAuthHeaders() }).subscribe(() => {
      this.loadUsers();
    });
  }

  update(user: User) {
    const dialogRef = this.dialog.open(UserEditDialogComponent, {
      width: '350px',
      data: { ...user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.http.put(`${this.apiUrl}/${user.id}`, result, { headers: this.getAuthHeaders() }).subscribe(() => {
          this.loadUsers();
        });
      }
    });
  }

  delete(user: User) {
    if (confirm(`¿Eliminar usuario ${user.name}?`)) {
      this.http.delete(`${this.apiUrl}/${user.id}`, { headers: this.getAuthHeaders() }).subscribe(() => {
        this.loadUsers();
      });
    }
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(UserEditDialogComponent, {
      width: '350px',
      data: { id: 0, name: '', isComplete: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createUser(result);
      }
    });
  }
}

@Component({
  selector: 'app-user-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    MatDialogModule,
    MatInputModule,
    MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.id ? 'Editar' : 'Crear' }} Usuario</h2>
    <mat-dialog-content>
      <mat-form-field class="width-100">
        <mat-label>Nombre Completo</mat-label>
        <input matInput [(ngModel)]="data.name">
      </mat-form-field>
      <mat-form-field class="width-100">
        <mat-label>Nombre de Usuario</mat-label>
        <input matInput [(ngModel)]="data.username">
      </mat-form-field>
      <mat-form-field class="width-100">
        <mat-label>Correo</mat-label>
        <input matInput [(ngModel)]="data.email" type="email">
      </mat-form-field>
      <mat-form-field class="width-100">
        <mat-label>Contraseña</mat-label>
        <input matInput [(ngModel)]="data.password" type="password">
      </mat-form-field>
      <mat-form-field class="width-100">
        <mat-label>Completado</mat-label>
        <mat-select [(ngModel)]="data.isComplete">
          <mat-option [value]="true">Sí</mat-option>
          <mat-option [value]="false">No</mat-option>
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-button color="primary" (click)="onSave()">Guardar</button>
    </mat-dialog-actions>
  `
})
export class UserEditDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<UserEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    this.dialogRef.close(this.data);
  }
}
