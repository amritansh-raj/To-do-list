var myApp = angular.module("myApp", ["ui.router"]);
var loginId;

myApp.config(function ($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state("login", {
      url: "/login",
      templateUrl: "login.html",
      controller: "loginController",
    })
    .state("todo", {
      url: "/todo",
      templateUrl: "todo.html",
      controller: "todoController",
    })
    .state("register", {
      url: "/register",
      templateUrl: "register.html",
      controller: "registerController",
    });

  $urlRouterProvider.otherwise("/register");

  // $locationProvider.html5Mode(true);
});

myApp.controller("registerController", [
  "$scope",
  "$http",
  "$state",
  "$window",
  function ($scope, $http, $state, $window, SweetAlert) {
    $scope.formData = {};

    $scope.submitForm = function () {
      var pass = $scope.formData.password;
      var confirmPass = $scope.formData.password2;

      var userData = {
        username: $scope.formData.name,
        email: $scope.formData.email,
        phoneno: $scope.formData.phno,
        password: $scope.formData.password,
        confirmPass: $scope.formData.password2,
      };

      if (pass === confirmPass) {
        $scope.formData = {};

        $http
          .post("http://10.21.80.57:8000/api/register/", userData)
          .then(function (response) {
            var register = response.data;
            console.log(register);
            $state.go("login");
          })
          .catch(function (error) {
            if (error.data && error.data.message) {
              $window.alert(error.data.message);
            } else {
              $window.alert("An error occured. Please try again");
            }
          });
      } else {
        // SweetAlert.swal("Hello world!");
      }
    };
  },
]);

myApp.controller("loginController", [
  "$scope",
  "$http",
  "$state",
  "$window",
  function ($scope, $http, $state, $window) {
    $scope.loginData = {};

    $scope.submitLoginForm = function () {
      var userLogin = {
        email: $scope.loginData.email,
        password: $scope.loginData.password,
      };

      console.log(userLogin);

      $scope.loginData = {};

      $http
        .post("http://10.21.80.57:8000/api/login/", userLogin)
        .then(function (response) {
          var register = response.data;
          var loginId = register.id;
          localStorage.setItem("loginID", loginId);

          console.log(loginId);
          $state.go("todo");
        })
        .catch(function (error) {
          if (error.data && error.data.message) {
            $window.alert(error.data.message);
          } else {
            $window.alert("An error occured. Please try again");
          }
        });
    };
  },
]);

myApp.controller("todoController", [
  "$scope",
  "$http",
  "$state",
  "$window",
  function ($scope, $http, $state, $window) {
    var apiUrl = "http://10.21.80.57:8000/api/todo/";

    var loginID = localStorage.getItem("loginID");
    console.log(loginID)
    if (loginID) {
      Id = loginID.toString();

      $scope.todolist = [];

      $http.get(apiUrl, { params: { loginid: Id } }).then(function (response) {
        const storedTasks = response.data.task;
        if (storedTasks) {
          $scope.todolist = storedTasks;
        }

        console.log($scope.todolist);
        $scope.displayTasks();
      });

      $scope.displayTasks = function () {
        $scope.todolist.forEach(function (task) {
          task.editMode = false;
        });

        $scope.filteredTasks = $scope.todolist.filter(function (task) {
          return (
            task.status === false ||
            task.status === "false" ||
            task.status === "true" ||
            task.status === true
          );
        });

        console.log($scope.filteredTasks);
      };

      $scope.addTask = function () {
        if (!$scope.task) {
          $window.alert("Enter task");
          return;
        }
        var newTask = { taskText: $scope.task, status: false, id: loginId };

        $http.post(apiUrl, newTask).then(function (response) {
          $scope.todolist.push(response.data);

          $scope.task = "";
          $scope.displayTasks();
        });
      };

      $scope.toggleStatus = function (task) {
        task.status = !task.status;
        if (task.status) {
          task.checkedTime = new Date().toLocaleString();
        } else {
          task.checkedTime = "";
        }
      };

      $scope.edit = function (task) {
        if ($scope.editingTask) {
          $scope.cancelEdit($scope.editingTask);
        }

        task.editMode = true;
        $scope.editingTask = task;
        task.update = task.taskText;
      };

      $scope.cancelEdit = function (task) {
        task.editMode = false;
        task.taskText = task.update;
        $scope.editingTask = null;
      };

      $scope.saveEdit = function (task) {
        if (task.update) {
          task.taskText = task.update;
          $http
            .put(apiUrl, task)
            .then(function (response) {
              console.log(task);
              console.log("Task updated successfully:", response.data);
              $scope.displayTasks();
            })
            .catch(function (error) {
              console.log("error", error);
            });
        } else {
          $scope.displayTasks();
        }
      };

      $scope.delete = function () {
        var deletedTasks = [];
        angular.forEach($scope.todolist, function (task) {
          if (task.status) {
            if (task.status != "completed") {
              task.status = "deleted";

              $http
                .delete(apiUrl, { data: task })
                .then(function (response) {
                  console.log("deleted");
                })
                .catch(function (error) {
                  console.log("error", error);
                });
            }
          }
          deletedTasks.push(task);
        });
        $scope.todolist = deletedTasks;
        $scope.displayTasks();
      };

      $scope.complete = function () {
        var completedTasks = [];
        angular.forEach($scope.todolist, function (task) {
          if (task.status) {
            if (task.status != "deleted") {
              task.status = "completed";

              $http
                .put(apiUrl, task)
                .then(function (response) {
                  console.log("completed");
                })
                .catch(function (error) {
                  console.log("error", error);
                });
            }
          }
          completedTasks.push(task);
        });
        $scope.todolist = completedTasks;
        $scope.displayTasks();
      };

      $scope.logOut = function () {
        $http
          .post("http://10.21.80.57:8000/api/logout/", { loginid: loginID })
          .then(function (response) {
            var register = response.data.message;
            console.log(register);
            localStorage.removeItem("loginID");
            $state.go("login");
          });
      };
    } else {
      $state.go("login");
    }
  },
]);
