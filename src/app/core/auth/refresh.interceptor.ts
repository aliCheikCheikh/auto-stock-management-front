import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "./auth.service";
import { Router } from "@angular/router";
import { catchError, switchMap, throwError } from "rxjs";

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            const noRefreshPaths = ['/auth/refresh','/auth/login','/auth/logout'];
            if (error.status === 401 && !noRefreshPaths.some((path)=>req.url.includes(path))) {
                return authService.refresh().pipe(
                    switchMap(() => next(req)),
                    catchError((refreshError) => {
                        authService.clearSession();
                        router.navigateByUrl('/login');
                        return throwError(() => refreshError);
                    })
                );
            }
            return throwError(() => error);
        })

    );
};