import { Component, Inject, ViewChild, AfterViewInit } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  displayedColumns: string[] = ['id', 'name', 'isComplete', 'actions'];
  dataSource = new MatTableDataSource<User>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private dialog: MatDialog, private http: HttpClient) { }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.loadUsers();
  }

  loadUsers() {
    this.http.get<User[]>('http://localhost:5000/api/Todo').subscribe(data => {
      this.dataSource.data = data;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`http://localhost:5000/api/Todo/${id}`);
  }

  createUser(user: User) {
    this.http.post<User>('http://localhost:5000/api/Todo', user).subscribe(() => {
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
        this.http.put(`http://localhost:5000/api/Todo/${user.id}`, result).subscribe(() => {
          this.loadUsers();
        });
      }
    });
  }

  delete(user: User) {
    if (confirm(`¿Eliminar usuario ${user.name}?`)) {
      this.http.delete(`http://localhost:5000/api/Todo/${user.id}`).subscribe(() => {
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
        <mat-label>Nombre</mat-label>
        <input matInput [(ngModel)]="data.name">
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


